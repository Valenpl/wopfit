package com.wopfit.service;

import java.text.Normalizer;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wopfit.config.ApiException;
import com.wopfit.domain.Plan;
import com.wopfit.domain.Preferences;
import com.wopfit.domain.WopiMessage;
import com.wopfit.repo.WopiMessageRepository;
import com.wopfit.service.MealCatalog.Meal;
import com.wopfit.web.dto.Dtos.SessionDto;
import com.wopfit.web.dto.Dtos.ShoppingItem;
import com.wopfit.web.dto.Dtos.TodayDto;
import com.wopfit.web.dto.Dtos.WeekDto;
import com.wopfit.web.dto.Dtos.WopiAction;
import com.wopfit.web.dto.Dtos.WopiAskResponse;
import com.wopfit.web.dto.Dtos.WopiCard;
import com.wopfit.web.dto.Dtos.WopiDto;
import com.wopfit.web.dto.Dtos.WopiMessageDto;

/**
 * "Preguntale a Wopi": asistente con respuestas armadas por reglas (como en la v6) sobre los datos reales de la persona:
 * su rutina de hoy, su menú filtrado por lo que no come, su presupuesto, la lista del súper y su semana.
 * Respeta las restricciones del perfil, deriva a un profesional si algo duele y nunca reemplaza a uno.
 * Más adelante se puede cambiar `answer` por un modelo de IA sin tocar el resto.
 */
@Service
public class WopiService {
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

    public WopiService(WopiMessageRepository messages, PremiumService premium, ProfileService profile, PlanService plans, MealService meals,
                       PlaceService places, MealCatalog mealCatalog, WorkoutCatalog workouts, TimeService time, ObjectMapper json) {
        this.messages = messages;
        this.premium = premium;
        this.profile = profile;
        this.plans = plans;
        this.meals = meals;
        this.places = places;
        this.mealCatalog = mealCatalog;
        this.workouts = workouts;
        this.time = time;
        this.json = json;
    }

    /** Una respuesta: texto (con **negrita**), tarjetas, botones, si admite "otras opciones" y de qué venía hablando. */
    record Reply(String text, List<WopiCard> cards, List<WopiAction> actions, boolean more, String context) {
        static Reply of(String text, WopiAction... actions) {
            return new Reply(text, List.of(), List.of(actions), false, null);
        }
    }

    record Extra(List<WopiCard> cards, List<WopiAction> actions, boolean more) {}

    // ---------------- API ----------------

    @Transactional(readOnly = true)
    public WopiDto chat(Long userId) {
        List<WopiMessage> last = new ArrayList<>(messages.findTop40ByUserIdOrderByIdDesc(userId));
        java.util.Collections.reverse(last);
        return new WopiDto(premium.isPremium(userId), premium.wopiLeft(userId), premium.wopiLimit(userId), last.stream().map(this::dto).toList());
    }

    @Transactional
    public WopiAskResponse ask(Long userId, String question) {
        String q = question.trim();
        if (premium.wopiLeft(userId) <= 0) {
            throw ApiException.conflict(premium.isPremium(userId) ? "Usaste tus 20 consultas de este mes. Se renuevan el 1° del mes que viene."
                    : "Usaste tus 3 consultas gratis de este mes. Con Premium tenés 20.");
        }
        String prev = messages.findFirstByUserIdAndRoleOrderByIdDesc(userId, "wopi").map(WopiMessage::getContext).orElse(null);
        WopiMessage asked = save(userId, "user", q, null, null);
        Reply r = answer(userId, q, prev);
        WopiMessage reply = save(userId, "wopi", r.text(), new Extra(r.cards(), r.actions(), r.more()), r.context());
        return new WopiAskResponse(premium.wopiLeft(userId), dto(asked), dto(reply));
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

    private WopiMessageDto dto(WopiMessage m) {
        Extra e = null;
        try {
            if (m.getExtra() != null) e = json.readValue(m.getExtra(), Extra.class);
        } catch (JsonProcessingException ex) {
            e = null;
        }
        return new WopiMessageDto(m.getId(), m.getRole(), m.getText(), e == null ? List.of() : e.cards(), e == null ? List.of() : e.actions(),
                e != null && e.more());
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
        if (has(t, "rutina|ejercicio|entren|bloque") && !has(t, "minuto|tiempo")) return routine(userId);
        if (has(t, "duele|dolor|rodilla|espalda|lesi")) return pain(userId, name);
        if (has(t, "minuto|tiempo|corto") && !has(t, "desayun|almuer|almorz|cen|comer|comida")) return quick(userId, 0, "¡Con poco tiempo también suma! ");
        if (has(t, "super|lista|compr")) return shopping(userId);
        if (has(t, "cen|com|almuer|almorz|desayun|merienda|receta|\\$|plata|barat|rapid")) {
            Integer slot = slotFrom(t);
            int h = time.now().getHour();
            return mealIdeas(userId, slot != null ? slot : h < 11 ? 0 : h < 16 ? 1 : 2, priceFrom(t), 0);
        }
        // Descanso antes que motivación: "no puedo dormir" es de sueño, no de ganas.
        if (has(t, "dorm|suen|estr|ansie|respir")) {
            return Reply.of("Probá la respiración 4-7-8 antes de dormir: inhalá 4 segundos, sostené 7 y exhalá en 8. Repetilo 4 veces. "
                    + "Y tratá de dejar el celu 30 minutos antes.", new WopiAction("Poner una meta de descanso", "go", "/metas/nueva"));
        }
        if (has(t, "motiv|ganas|cansad|no puedo|frustr")) return motivation(userId);
        return Reply.of("Puedo ayudarte con tu rutina, tus comidas, la lista del súper o cómo seguir cuando no tenés ganas. ¿Qué necesitás"
                + (name.isEmpty() ? "" : ", " + name) + "?");
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
        return new Reply(text, cards, List.of(), pool.size() > 2, "meal:" + slot + ":" + (lim == null ? "" : lim) + ":" + (from + 2));
    }

    private SessionDto pendingToday(TodayDto td) {
        return td.session() != null && "PENDING".equals(td.session().status()) && td.session().movedFrom() == null ? td.session() : null;
    }

    /** Una versión corta para hoy. Si hay rutina pendiente, se puede usar en su lugar (la completa pasa al próximo día libre). */
    private Reply quick(Long userId, int i, String lead) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        String kind = QUICK.get(Math.floorMod(i, QUICK.size()));
        TodayDto td = plans.today(userId);
        SessionDto s = pendingToday(td);
        WorkoutCatalog.Content a = workouts.alternative(kind, s == null ? 0 : s.template(), plan.getMinutes(), plan.getLevel(), p);
        WopiAction start = kind.equals("walk") ? new WopiAction("Empezar ahora", "go", "/entreno/caminata")
                : s != null ? new WopiAction("Hacer esto hoy", "alt", s.id() + "|" + kind) : new WopiAction("Caminata de 15 min", "go", "/entreno/caminata");
        return new Reply(lead + "Te propongo: **" + a.title() + "** (" + a.minutes() + " min). " + a.description(), List.of(), List.of(start), true, "quick:" + i);
    }

    private Reply routine(Long userId) {
        TodayDto td = plans.today(userId);
        SessionDto s = td.session();
        if (s == null || s.content() == null || "MOVED".equals(s.status())) {
            SessionDto n = td.next().isEmpty() ? null : td.next().get(0);
            return Reply.of("Hoy no tenés rutina: es día de descanso." + (n == null ? "" : " La próxima es el " + PlanService.fmt(n.date()) + ": **" + n.title() + "**.")
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
        SessionDto s = pendingToday(plans.today(userId));
        List<WopiAction> acts = new ArrayList<>();
        acts.add(new WopiAction("Consultar a un entrenador", "go", "/profesionales?tipo=entre"));
        if (s != null) acts.add(new WopiAction("Hacer movilidad suave", "alt", s.id() + "|suave"));
        return new Reply("Lamento que te moleste algo" + (name.isEmpty() ? "" : ", " + name) + ". Por las dudas, hoy evitá sentadillas profundas y estocadas: "
                + "cambialas por puente de glúteos y movilidad suave. **Si el dolor es fuerte o no se va, consultá con un profesional.**", List.of(), acts, false, null);
    }

    private Reply shopping(Long userId) {
        List<ShoppingItem> items = meals.shopping(userId, time.today()).items();
        long forList = places.offers(userId).offers().stream().filter(o -> o.forList()).count();
        String top = String.join(", ", items.stream().limit(6).map(x -> x.name().substring(0, 1).toUpperCase(Locale.ROOT) + x.name().substring(1)).toList());
        return new Reply("Para esta semana necesitás principalmente: **" + top + "**." + (forList > 0 ? " Hay " + forList + (forList == 1 ? " oferta que te sirve." : " ofertas que te sirven.") : ""),
                List.of(), List.of(new WopiAction("Ver la lista del súper", "go", "/comida?tab=super"), new WopiAction("Ver ofertas", "go", "/ofertas")), false, null);
    }

    private Reply motivation(Long userId) {
        WeekDto w = plans.week(userId, time.today());
        return Reply.of("Es normal tener días así. Esta semana ya hiciste " + w.done() + " de " + w.total()
                + " entrenamientos. Hoy alcanza con algo chiquito: una caminata de 15 minutos también es progreso 💙",
                new WopiAction("Caminata de 15 min", "go", "/entreno/caminata"));
    }
}
