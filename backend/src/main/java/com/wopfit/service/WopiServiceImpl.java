package com.wopfit.service;

import java.text.Normalizer;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wopfit.entity.Plan;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.WopiMessage;
import com.wopfit.entity.dto.SessionResponse;
import com.wopfit.entity.dto.ShoppingItem;
import com.wopfit.entity.dto.TodayResponse;
import com.wopfit.entity.dto.WeekResponse;
import com.wopfit.entity.dto.WopiAction;
import com.wopfit.entity.dto.WopiAskResponse;
import com.wopfit.entity.dto.WopiCard;
import com.wopfit.entity.dto.WopiMessageResponse;
import com.wopfit.entity.dto.WopiResponse;
import com.wopfit.exceptions.LimitReachedException;
import com.wopfit.repository.WopiMessageRepository;
import com.wopfit.service.support.MealCatalog.Meal;
import com.wopfit.service.support.Catalog;
import com.wopfit.service.support.MealCatalog;
import com.wopfit.service.support.WorkoutCatalog;
import com.wopfit.service.support.ExpertAdvice;
import com.wopfit.service.support.WopiAi;

@RequiredArgsConstructor
@Service
public class WopiServiceImpl implements WopiService {
    private static final String[] SLOT_NAMES = {"desayuno", "almuerzo", "cena"};
    private static final List<String> QUICK = List.of("express", "liviana", "walk", "sinequipo");

    private final WopiMessageRepository messages;
    private final PremiumService premium;
    private final ProfileService profile;
    private final PlanService plans;
    private final MealService meals;
    private final PlaceService places;
    private final MealCatalog mealCatalog;
    private final WorkoutCatalog workouts;
    private final TimeService time;
    private final ObjectMapper json;
    private final WopiAi ai;

    /** Una respuesta: texto (con **negrita**), tarjetas, botones, si admite "otras opciones", de qué venía hablando y la fuente si es un consejo de expertos. */
    record Reply(String text, List<WopiCard> cards, List<WopiAction> actions, boolean more, String context, String source, String sourceUrl) {
        static Reply of(String text, WopiAction... actions) {
            return new Reply(text, List.of(), List.of(actions), false, null, null, null);
        }
    }

    record Extra(List<WopiCard> cards, List<WopiAction> actions, boolean more, String source, String sourceUrl) {}

    // ---------------- API ----------------

    @Transactional(readOnly = true)
    @Override
    public WopiResponse chat(Long userId) {
        List<WopiMessage> last = new ArrayList<>(messages.findTop40ByUserIdOrderByIdDesc(userId));
        Collections.reverse(last);
        boolean pr = premium.isPremium(userId);
        return new WopiResponse(pr, premium.wopiLeft(userId, pr), premium.wopiLimit(pr), ai.enabled(), last.stream().map(this::dto).toList());
    }

    @Transactional
    @Override
    public WopiAskResponse ask(Long userId, String question) {
        String q = question.trim();
        boolean pr = premium.isPremium(userId);
        if (premium.wopiLeft(userId, pr) <= 0) {
            throw new LimitReachedException(pr ? "Usaste tus 20 consultas de este mes. Se renuevan el 1° del mes que viene."
                    : "Usaste tus 3 consultas gratis de este mes. Con Premium tenés 20.");
        }
        String prev = messages.findFirstByUserIdAndRoleOrderByIdDesc(userId, "wopi").map(WopiMessage::getContext).orElse(null);
        List<WopiAi.Turn> history = history(userId);
        WopiMessage asked = save(userId, "user", q, null, null);
        // Con IA responde Claude; si no hay key, falla o se niega, responden las reglas de siempre.
        Reply r = aiAnswer(userId, q, prev, history).orElseGet(() -> answer(userId, q, prev));
        WopiMessage reply = save(userId, "wopi", r.text(), new Extra(r.cards(), r.actions(), r.more(), r.source(), r.sourceUrl()), r.context());
        return new WopiAskResponse(premium.wopiLeft(userId, pr), dto(asked), dto(reply));
    }

    private WopiMessage save(Long userId, String role, String text, Extra extra, String context) {
        WopiMessage m = new WopiMessage();
        m.setUser(profile.user(userId));
        m.setRole(role);
        m.setText(text.length() > 1000 ? text.substring(0, 1000) : text);
        try {
            m.setExtra(extra == null ? null : json.writeValueAsString(extra));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException(e);
        }
        m.setContext(context);
        m.setMonth(premium.monthKey());
        m.setCreatedAt(Instant.now());
        return messages.save(m);
    }

    private WopiMessageResponse dto(WopiMessage m) {
        Extra e = null;
        try {
            if (m.getExtra() != null) e = json.readValue(m.getExtra(), Extra.class);
        } catch (JsonProcessingException ex) {
            e = null;
        }
        return new WopiMessageResponse(m.getId(), m.getRole(), m.getText(), e == null ? List.of() : e.cards(), e == null ? List.of() : e.actions(),
                e != null && e.more(), e == null ? null : e.source(), e == null ? null : e.sourceUrl());
    }

    // ---------------- respuestas ----------------

    /** Minúsculas y sin tildes, para reconocer "súper" y "super" igual. */
    static String plain(String s) {
        return Normalizer.normalize(s.toLowerCase(Locale.ROOT), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }

    private static boolean has(String t, String regex) {
        return Pattern.compile(regex).matcher(t).find();
    }

    static Integer slotFrom(String t) {
        if (has(t, "desayun|manana|merienda")) return 0;
        if (has(t, "almuer|almorz|mediodia")) return 1;
        if (has(t, "cen|noche")) return 2;
        return null;
    }

    /** "$2.000", "2000" o "2.000 pesos" → 2000. */
    static Integer priceFrom(String t) {
        Matcher m = Pattern.compile("\\$\\s?(\\d[\\d.]*)").matcher(t);
        if (!m.find()) {
            m = Pattern.compile("(\\d{3,}[\\d.]*)").matcher(t);
            if (!m.find()) return null;
        }
        return Integer.valueOf(m.group(1).replace(".", ""));
    }

    private static String money(int n) {
        return "$" + String.format(Locale.ROOT, "%,d", n).replace(',', '.');
    }

    private String firstName(Long userId) {
        String n = profile.user(userId).getName();
        return n == null || n.isBlank() ? "" : n.trim().split("\\s+")[0];
    }

    private static String avoidText(Preferences p) {
        List<String> t = new ArrayList<>(p.getAvoid().stream().map(Catalog.AVOID::get).toList());
        if (p.getOtherAvoid() != null && !p.getOtherAvoid().isBlank()) t.add("Sin " + p.getOtherAvoid().trim().toLowerCase(Locale.ROOT));
        return t.isEmpty() ? "sin restricciones" : String.join(", ", t).toLowerCase(Locale.ROOT);
    }

    Reply answer(Long userId, String question, String prev) {
        String t = plain(question);
        String name = firstName(userId);
        if (has(t, "otra|otro|mas opciones|distint|diferente") && prev != null) {
            String[] c = prev.split(":");
            if (c[0].equals("meal")) return mealIdeas(userId, Integer.parseInt(c[1]), c[2].isEmpty() ? null : Integer.valueOf(c[2]), Integer.parseInt(c[3]));
            if (c[0].equals("quick")) return quick(userId, Integer.parseInt(c[1]) + 1, "");
        }
        // Las dudas de salud, alimentación y sueño las responden los consejos de expertos, salvo que pida una comida concreta.
        if (!has(t, "desayun|almuer|almorz|merend|merienda|\\bcen(a|ar|o|amos)\\b|receta|\\$|pesos|plata|barat")) {
            Optional<ExpertAdvice.Advice> a = ExpertAdvice.answer(t, profile.prefs(userId));
            if (a.isPresent()) return expert(a.get());
        }
        if (has(t, "rutina|ejercicio|entren|bloque") && !has(t, "minuto|tiempo")) return routine(userId);
        if (has(t, "duele|dolor|rodilla|espalda|lesi")) return pain(userId, name);
        if (has(t, "minuto|tiempo|corto") && !has(t, "desayun|almuer|almorz|cen|comer|comida")) return quick(userId, 0, "¡Con poco tiempo también suma! ");
        if (has(t, "super|lista|compr")) return shopping(userId);
        if (has(t, "cen|com|almuer|almorz|desayun|merienda|receta|\\$|plata|barat|rapid")) {
            Integer slot = slotFrom(t);
            int h = time.now().getHour();
            return mealIdeas(userId, slot != null ? slot : h < 11 ? 0 : h < 16 ? 1 : 2, priceFrom(t), 0);
        }
        if (has(t, "motiv|ganas|cansad|no puedo|frustr")) return motivation(userId);
        return Reply.of("Puedo ayudarte con tu rutina, tus comidas, la lista del súper, dudas de alimentación, sueño o estrés, o cómo seguir cuando no tenés ganas. ¿Qué necesitás"
                + (name.isEmpty() ? "" : ", " + name) + "?");
    }

    private static Reply expert(ExpertAdvice.Advice a) {
        return new Reply(a.tip().text(), List.of(), a.action() == null ? List.of() : List.of(a.action()), false, null, a.tip().source(), a.tip().url());
    }

    /** Dos ideas por vez del menú que le sirve (restricciones y presupuesto); "otras opciones" sigue con las próximas. */
    private Reply mealIdeas(Long userId, int slot, Integer lim, int offset) {
        Preferences p = profile.prefs(userId);
        List<Meal> pool = mealCatalog.options(slot, p);
        if (lim != null) {
            List<Meal> cheap = pool.stream().filter(m -> m.price() <= lim).toList();
            if (!cheap.isEmpty()) pool = cheap;
        }
        boolean restart = offset >= pool.size();
        int from = restart ? 0 : offset;
        List<Meal> pick = pool.subList(from, Math.min(pool.size(), from + 2));
        List<WopiCard> cards = pick.stream().map(m -> new WopiCard(m.name(), money(m.price()) + " · " + m.ingredients(),
                new WopiAction("Agregar a mi " + SLOT_NAMES[slot] + " de hoy", "meal", slot + "|" + m.name()))).toList();
        String text = (restart ? "Ya te mostré todas las opciones, vuelvo a empezar. " : "")
                + "Te propongo estas ideas de " + SLOT_NAMES[slot] + " (" + avoidText(p) + ")" + (lim != null ? " por menos de " + money(lim) : "") + ":";
        return new Reply(text, cards, List.of(), pool.size() > 2, "meal:" + slot + ":" + (lim == null ? "" : lim) + ":" + (from + 2), null, null);
    }

    private SessionResponse pendingToday(TodayResponse td) {
        return td.session() != null && "PENDING".equals(td.session().status()) && td.session().movedFrom() == null ? td.session() : null;
    }

    /** Una versión corta para hoy. Si hay rutina pendiente, se puede usar en su lugar (la completa pasa al próximo día libre). */
    private Reply quick(Long userId, int i, String lead) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        String kind = QUICK.get(Math.floorMod(i, QUICK.size()));
        TodayResponse td = plans.today(userId);
        SessionResponse s = pendingToday(td);
        WorkoutCatalog.Content a = workouts.alternative(kind, s == null ? 0 : s.template(), plan.getMinutes(), plan.getLevel(), p);
        WopiAction start = kind.equals("walk") ? new WopiAction("Empezar ahora", "go", "/entreno/caminata")
                : s != null ? new WopiAction("Hacer esto hoy", "alt", s.id() + "|" + kind) : new WopiAction("Caminata de 15 min", "go", "/entreno/caminata");
        return new Reply(lead + "Te propongo: **" + a.title() + "** (" + a.minutes() + " min). " + a.description(), List.of(), List.of(start), true, "quick:" + i, null, null);
    }

    private Reply routine(Long userId) {
        TodayResponse td = plans.today(userId);
        SessionResponse s = td.session();
        if (s == null || s.content() == null || "MOVED".equals(s.status())) {
            SessionResponse n = td.next().isEmpty() ? null : td.next().get(0);
            return Reply.of("Hoy no tenés rutina: es día de descanso." + (n == null ? "" : " La próxima es el " + PlanServiceImpl.fmt(n.date()) + ": **" + n.title() + "**.")
                    + " Si querés moverte igual, una caminata suma.", new WopiAction("Caminata de 15 min", "go", "/entreno/caminata"));
        }
        WorkoutCatalog.Content c = s.content();
        StringBuilder b = new StringBuilder("Tu rutina de hoy es **").append(c.title()).append("** (").append(c.minutes()).append(" min).");
        if (c.blocks().size() >= 3) {
            b.append(" Arranca con ").append(c.blocks().get(0).minutes()).append(" min de ").append(c.blocks().get(0).name().toLowerCase(Locale.ROOT))
                    .append(", sigue con ").append(c.blocks().get(1).name().toLowerCase(Locale.ROOT))
                    .append(" y cierra con ").append(c.blocks().get(2).name().toLowerCase(Locale.ROOT)).append('.');
            if (!c.blocks().get(1).items().isEmpty()) {
                b.append(" Tip: en \"").append(c.blocks().get(1).items().get(0).name().toLowerCase(Locale.ROOT)).append("\" priorizá la técnica antes que la velocidad.");
            }
        }
        b.append("DONE".equals(s.status()) ? " ¡Y ya la hiciste! 💪" : " Si algo te molesta, avisame y lo cambiamos.");
        return Reply.of(b.toString(), new WopiAction("Ver la rutina", "go", "/entreno/" + s.id()));
    }

    private Reply pain(Long userId, String name) {
        SessionResponse s = pendingToday(plans.today(userId));
        List<WopiAction> acts = new ArrayList<>();
        acts.add(new WopiAction("Consultar a un entrenador", "go", "/profesionales?tipo=entre"));
        if (s != null) acts.add(new WopiAction("Hacer movilidad suave", "alt", s.id() + "|suave"));
        return new Reply("Lamento que te moleste algo" + (name.isEmpty() ? "" : ", " + name) + ". Por las dudas, hoy evitá sentadillas profundas y estocadas: "
                + "cambialas por puente de glúteos y movilidad suave. **Si el dolor es fuerte o no se va, consultá con un profesional.**", List.of(), acts, false, null, null, null);
    }

    private Reply shopping(Long userId) {
        List<ShoppingItem> items = meals.shopping(userId, time.today()).items();
        long forList = places.offers(userId).offers().stream().filter(o -> o.forList()).count();
        String top = String.join(", ", items.stream().limit(6).map(x -> x.name().substring(0, 1).toUpperCase(Locale.ROOT) + x.name().substring(1)).toList());
        return new Reply("Para esta semana necesitás principalmente: **" + top + "**." + (forList > 0 ? " Hay " + forList + (forList == 1 ? " oferta que te sirve." : " ofertas que te sirven.") : ""),
                List.of(), List.of(new WopiAction("Ver la lista del súper", "go", "/comida?tab=super"), new WopiAction("Ver ofertas", "go", "/ofertas")), false, null, null, null);
    }

    private Reply motivation(Long userId) {
        WeekResponse w = plans.week(userId, time.today());
        return Reply.of("Es normal tener días así. Esta semana ya hiciste " + w.done() + " de " + w.total()
                + " entrenamientos. Hoy alcanza con algo chiquito: una caminata de 15 minutos también es progreso 💙",
                new WopiAction("Caminata de 15 min", "go", "/entreno/caminata"));
    }

    // ---------------- con IA ----------------

    private static final List<String> QUICK_KINDS = List.of("express", "liviana", "caminata", "sin_equipo");
    private static final DateTimeFormatter WHEN = DateTimeFormatter.ofPattern("EEEE d 'de' MMMM, HH:mm", Locale.forLanguageTag("es-AR"));

    /** Las herramientas que puede usar Claude: las mismas respuestas de las reglas, con sus tarjetas y botones. */
    private static final List<com.anthropic.models.messages.Tool> TOOLS = List.of(
            WopiAi.tool("ideas_de_comida", "Ideas de comidas del menú de la persona (respeta lo que no come y su presupuesto). Le muestra tarjetas para agregarlas a su día.",
                    props("comida", Map.of("type", "string", "enum", List.of("desayuno", "almuerzo", "cena")),
                            "precio_maximo", Map.of("type", "integer", "description", "Precio máximo en pesos, si lo pidió"),
                            "desde", Map.of("type", "integer", "description", "Para mostrar otras opciones: cuántas ya se mostraron (0 la primera vez)")),
                    List.of("comida")),
            WopiAi.tool("rutina_de_hoy", "La rutina de entrenamiento de hoy (o si es día de descanso) y la próxima.", Map.of(), List.of()),
            WopiAi.tool("rutina_corta", "Una versión corta para hoy, cuando tiene poco tiempo, poca energía o no tiene equipamiento.",
                    props("tipo", Map.of("type", "string", "enum", QUICK_KINDS)), List.of("tipo")),
            WopiAi.tool("lista_del_super", "Lo que necesita comprar esta semana y si hay ofertas que le sirven.", Map.of(), List.of()),
            WopiAi.tool("consejo_de_expertos", "Un consejo de fuentes de salud reconocidas sobre alimentación, sueño, estrés, hidratación o actividad física.",
                    props("tema", Map.of("type", "string", "description", "La duda, en pocas palabras")), List.of("tema")),
            WopiAi.tool("molestia_o_dolor", "Qué hacer hoy si tiene una molestia o dolor al entrenar. Le muestra cómo consultar a un profesional.", Map.of(), List.of()),
            WopiAi.tool("progreso_semana", "Cuántos entrenamientos hizo esta semana, para motivarla.", Map.of(), List.of()));

    private static Map<String, Object> props(Object... kv) {
        Map<String, Object> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put((String) kv[i], kv[i + 1]);
        return m;
    }

    /** Los últimos mensajes de la charla, del más viejo al más nuevo. */
    private List<WopiAi.Turn> history(Long userId) {
        List<WopiMessage> last = new ArrayList<>(messages.findTop40ByUserIdOrderByIdDesc(userId).stream().limit(10).toList());
        Collections.reverse(last);
        return last.stream().map(m -> new WopiAi.Turn("user".equals(m.getRole()), m.getText())).toList();
    }

    private Optional<Reply> aiAnswer(Long userId, String question, String prev, List<WopiAi.Turn> history) {
        if (!ai.enabled()) return Optional.empty();
        Collected c = new Collected();
        return ai.reply(context(userId, prev), history, question, TOOLS, (name, in) -> c.add(tool(userId, name, in)))
                .map(text -> new Reply(text, c.cards, c.actions, c.more, c.context, c.source, c.sourceUrl));
    }

    private Reply tool(Long userId, String name, JsonNode in) {
        return switch (name) {
            case "ideas_de_comida" -> mealIdeas(userId, Math.max(0, List.of(SLOT_NAMES).indexOf(in.path("comida").asText())),
                    in.hasNonNull("precio_maximo") && in.get("precio_maximo").asInt() > 0 ? in.get("precio_maximo").asInt() : null, Math.max(0, in.path("desde").asInt(0)));
            case "rutina_de_hoy" -> routine(userId);
            case "rutina_corta" -> quick(userId, Math.max(0, QUICK_KINDS.indexOf(in.path("tipo").asText())), "");
            case "lista_del_super" -> shopping(userId);
            case "consejo_de_expertos" -> ExpertAdvice.answer(plain(in.path("tema").asText()), profile.prefs(userId)).map(WopiServiceImpl::expert)
                    .orElse(Reply.of("No hay un consejo de expertos cargado sobre ese tema."));
            case "molestia_o_dolor" -> pain(userId, firstName(userId));
            case "progreso_semana" -> motivation(userId);
            default -> throw new IllegalArgumentException("Herramienta desconocida: " + name);
        };
    }

    /** Junta las tarjetas y los botones de las herramientas que usó Claude, y le pasa el resultado en texto. */
    private static class Collected {
        final List<WopiCard> cards = new ArrayList<>();
        final List<WopiAction> actions = new ArrayList<>();
        boolean more;
        String context, source, sourceUrl;

        String add(Reply r) {
            r.cards().stream().filter(x -> cards.size() < 4).forEach(cards::add);
            r.actions().stream().filter(a -> actions.size() < 3 && actions.stream().noneMatch(b -> b.label().equals(a.label()))).forEach(actions::add);
            more |= r.more();
            if (r.context() != null) context = r.context();
            if (source == null && r.source() != null) { source = r.source(); sourceUrl = r.sourceUrl(); }
            StringBuilder b = new StringBuilder(r.text());
            r.cards().forEach(x -> b.append("\n- ").append(x.title()).append(": ").append(x.subtitle()));
            if (!r.actions().isEmpty()) b.append("\nLa persona ve los botones: ").append(String.join(", ", r.actions().stream().map(WopiAction::label).toList()));
            if (r.source() != null) b.append("\nFuente: ").append(r.source());
            return b.toString();
        }
    }

    /** Lo que Wopi sabe de la persona y de su día. Sin email ni datos que no hacen falta. */
    private String context(Long userId, String prev) {
        Preferences p = profile.prefs(userId);
        Plan plan = plans.plan(userId);
        TodayResponse td = plans.today(userId);
        WeekResponse w = plans.week(userId, time.today());
        String name = firstName(userId);
        StringBuilder s = new StringBuilder("Contexto (actualizado ahora):\n")
                .append("Hoy es ").append(time.today().atTime(time.now()).format(WHEN)).append(".\n")
                .append(name.isEmpty() ? "" : "Se llama " + name + ".\n")
                .append("Objetivos: ").append(names(p.getGoals(), Catalog.GOALS)).append(". Nivel: ").append(Catalog.levelName(plan.getLevel()))
                .append(". Entrena ").append(plan.getDays().size()).append(" días por semana, ").append(plan.getMinutes()).append(" min.\n")
                .append("Comida: ").append(avoidText(p)).append("; presupuesto ").append(Catalog.BUDGETS.getOrDefault(p.getBudget(), p.getBudget()).toLowerCase(Locale.ROOT)).append(".\n")
                .append("Salud: ").append(p.getHealth().isEmpty() ? "nada para tener en cuenta" : names(p.getHealth(), Catalog.HEALTH)).append(".\n");
        if (plan.getAiSummary() != null) s.append("Su plan: ").append(plan.getAiSummary()).append('\n');
        SessionResponse t = td.session();
        s.append("Hoy: ").append(t == null || "MOVED".equals(t.status()) ? "día de descanso" : t.title() + " (" + t.status().toLowerCase(Locale.ROOT) + ")")
                .append(". Esta semana hizo ").append(w.done()).append(" de ").append(w.total()).append(" entrenamientos.\n");
        if (prev != null && prev.startsWith("meal:")) {
            String[] c = prev.split(":", -1);
            s.append("Lo último que le mostraste fueron ideas de ").append(SLOT_NAMES[Integer.parseInt(c[1])])
                    .append(c[2].isEmpty() ? "" : " por menos de " + money(Integer.parseInt(c[2]))).append(". Si pide otras, usá desde=").append(c[3]).append(".\n");
        }
        return s.toString();
    }

    private static String names(java.util.Set<String> keys, Map<String, String> catalog) {
        return keys.isEmpty() ? "no dijo" : String.join(", ", keys.stream().map(k -> catalog.getOrDefault(k, k).toLowerCase(Locale.ROOT)).toList());
    }
}
