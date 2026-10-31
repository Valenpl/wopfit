package com.wopfit.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;

import com.wopfit.entity.Preferences;
import com.wopfit.entity.dto.ExpertTip;
import com.wopfit.entity.dto.WopiAction;

/**
 * Consejos de nutricionistas, entrenadores y médicos (resources/expertos, fuentes en docs/fuentes-expertos.md).
 * Los muestran el plan y la rutina, y Wopi los usa para responder. Si un archivo está mal, la app no arranca.
 */
final class ExpertAdvice {
    private ExpertAdvice() {}

    private static final Set<String> PLACES = Set.of("plan", "entreno", "wopi");

    /** Un consejo: dónde se muestra, para quién es (* = todos), qué preguntas responde y el botón que suma en Wopi. */
    record Advice(Set<String> where, Set<String> forWhom, Pattern words, ExpertTip tip, WopiAction action) {
        boolean general() {
            return forWhom.contains("*");
        }

        boolean appliesTo(Preferences p) {
            return general() || p.getHealth().stream().anyMatch(forWhom::contains) || p.getAvoid().stream().anyMatch(forWhom::contains)
                    || p.getGoals().stream().anyMatch(forWhom::contains);
        }

        /** Para Wopi: primero lo que es para la persona, después lo general y al final lo que es para otros. */
        int rank(Preferences p) {
            return general() ? 1 : appliesTo(p) ? 0 : 2;
        }
    }

    private static final List<Advice> ALL = load();

    private static List<Advice> load() {
        try {
            Map<String, String[]> sources = new HashMap<>();
            for (String[] c : Tsv.rows("expertos/fuentes.tsv")) sources.put(c[0], c);
            List<Advice> out = new ArrayList<>();
            for (String[] c : Tsv.rows("expertos/consejos.tsv")) {
                if (c.length != 6) throw new IllegalStateException("Consejo con " + c.length + " columnas: " + String.join(" | ", c));
                Set<String> where = Set.of(c[0].split(","));
                Set<String> forWhom = Set.of(c[1].split(","));
                String[] src = sources.get(c[4]);
                if (!PLACES.containsAll(where) || src == null || forWhom.stream().anyMatch(k -> !k.equals("*") && !Catalog.HEALTH.containsKey(k)
                        && !Catalog.AVOID.containsKey(k) && !Catalog.GOALS.containsKey(k)) || where.contains("wopi") == c[2].equals("-")) {
                    throw new IllegalStateException("Consejo mal cargado: " + String.join(" | ", c));
                }
                String[] button = c[5].split("\\|");
                out.add(new Advice(where, forWhom, c[2].equals("-") ? null : Pattern.compile(c[2]), new ExpertTip(c[3], src[1], src[2]),
                        button.length == 2 ? new WopiAction(button[0], "go", button[1]) : null));
            }
            return out;
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** Los consejos del plan o de la rutina para la persona: primero los de su salud y objetivos, después los generales. */
    static List<ExpertTip> tips(String where, Preferences p) {
        return ALL.stream().filter(a -> a.where().contains(where) && a.appliesTo(p))
                .sorted(Comparator.comparing(Advice::general)).map(Advice::tip).toList();
    }

    /** El consejo que responde la pregunta (en minúsculas y sin tildes), si hay alguno. */
    static Optional<Advice> answer(String question, Preferences p) {
        return ALL.stream().filter(a -> a.where().contains("wopi") && a.words().matcher(question).find())
                .min(Comparator.comparingInt(a -> a.rank(p)));
    }
}
