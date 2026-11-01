package com.wopfit.service.support;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.wopfit.entity.Preferences;

/** Arma el contenido de cada rutina según nivel, equipamiento, gustos y salud. */
@Component
public class WorkoutCatalog {

    public record Exercise(String name, String amount) {}
    public record Block(String name, int minutes, String summary, List<Exercise> items) {}
    public record Content(String title, String description, int minutes, List<String> chips, String rest, List<Block> blocks) {}

    public static final String[][] TEMPLATES = {
            {"Fuerza y movilidad inicial", "Rutina guiada de bajo impacto, sin saltos. Ideal para retomar el ritmo sin sobrecargas."},
            {"Caminata con intervalos de fuerza", "Alternás caminata con ejercicios simples de fuerza para sumar movimiento sin cansarte de más."},
            {"Fuerza tren superior y core", "Brazos, espalda y abdomen con movimientos controlados y sin impacto en las rodillas."}
    };
    public static final List<String> ALTERNATIVES = List.of("express", "walk", "liviana", "suave", "sinequipo");

    private static boolean has(Preferences p, String item) {
        Set<String> eq = p.getEquipment();
        return eq.contains(item) || (eq.contains("gym") && !"nada".equals(item));
    }

    /** Embarazo o lesión: todo de bajo impacto. */
    public static boolean softHealth(Preferences p) {
        return p.getHealth().contains("embarazo") || p.getHealth().contains("lesion");
    }

    private static String reps(String level, boolean hold) {
        int i = Math.max(0, Catalog.LEVEL_STEPS.indexOf(level));
        String[] r = hold ? new String[]{"3×20 s", "3×25 s", "3×30 s", "3×40 s", "3×45 s"}
                          : new String[]{"3×10", "3×12", "3×12", "4×12", "4×15"};
        return r[i];
    }

    public Content session(int template, int minutes, String level, Preferences p) {
        int a = Math.max(3, Math.round(minutes * .2f));
        int c = Math.max(3, Math.round(minutes * .2f));
        int b = minutes - a - c;
        boolean soft = softHealth(p);
        boolean beg = level == null || level.startsWith("principiante") || soft;
        String w = has(p, "mancuernas") ? "con mancuerna" : has(p, "banda") ? "con banda elástica" : "con botellas de agua";
        boolean mat = has(p, "colchoneta");
        Set<String> acts = p.getActivities();

        List<Exercise> warm = new ArrayList<>();
        if (acts.contains("baile")) warm.add(new Exercise("Pasos de baile para entrar en calor", (a - 1) + " min"));
        else if (acts.contains("correr") && !beg) warm.add(new Exercise("Trote suave", (a - 1) + " min"));
        else if (acts.contains("bici") && has(p, "gym")) warm.add(new Exercise("Bici fija suave", (a - 1) + " min"));
        else warm.add(new Exercise("Caminata suave en el lugar", (a - 1) + " min"));
        warm.add(new Exercise("Círculos de brazos", "1 min"));

        List<Exercise> main = new ArrayList<>();
        String mainName;
        String summary;
        if (template == 0) {
            main.add(new Exercise(beg ? "Sentadilla asistida" : "Sentadilla " + w, reps(level, false)));
            main.add(new Exercise("Press de hombros " + w, reps(level, false)));
            main.add(new Exercise("Remo " + w, reps(level, false)));
            mainName = "Fuerza";
            summary = (beg ? "Sentadilla asistida" : "Sentadilla") + " + press ligero";
        } else if (template == 1) {
            int rounds = Math.max(2, Math.round(b / 6f));
            main.add(new Exercise("Caminata rápida (" + rounds + " rondas)", Math.round(b * .6f) + " min"));
            main.add(new Exercise(soft ? "Elevación de talones apoyada en la pared" : "Estocadas alternadas", reps(level, false)));
            main.add(new Exercise(beg ? "Flexiones en pared" : "Flexiones con rodillas apoyadas", reps(level, false)));
            mainName = "Intervalos";
            summary = "Caminata rápida + fuerza simple";
        } else {
            main.add(new Exercise(beg ? "Flexiones en pared" : "avanzado".equals(level) ? "Flexiones completas" : "Flexiones con rodillas apoyadas", reps(level, false)));
            main.add(new Exercise("Remo " + w, reps(level, false)));
            main.add(new Exercise(soft ? "Plancha apoyada en la pared" : "Plancha", reps(level, true)));
            main.add(new Exercise(soft ? "Respiración con activación de abdomen" : "Bicho muerto", reps(level, false)));
            mainName = "Tren superior y core";
            summary = "Brazos, espalda y abdomen";
        }

        // OMS 2020: en el embarazo, nada boca arriba después del primer trimestre.
        String bridge = p.getHealth().contains("embarazo") ? "Patada de glúteo en cuatro apoyos" : "Puente de glúteos";
        List<Exercise> mob = new ArrayList<>(List.of(new Exercise(bridge, "2×12"), new Exercise("Gato-vaca", "1 min")));
        mob.add(acts.contains("yoga") ? new Exercise("Saludo al sol suave", "2 min") : new Exercise("Estiramiento de isquios", "1 min"));

        List<String> chips = new ArrayList<>();
        chips.add(has(p, "mancuernas") ? "Mancuernas ligeras" : has(p, "banda") ? "Banda elástica" : "Solo tu cuerpo");
        chips.add(mat ? "Colchoneta" : "Toalla o alfombra");
        chips.add(soft ? "Bajo impacto" : Catalog.levelName(level));

        String mobName = mat ? "Movilidad en colchoneta" : "Movilidad en el piso";
        return new Content(TEMPLATES[template][0], TEMPLATES[template][1], minutes, chips, beg ? "45 s" : "30 s", List.of(
                new Block("Activación", a, "Activación y caminata suave", warm),
                new Block(mainName, b, summary, main),
                new Block(mobName, c, mobName, mob)));
    }

    /** Versiones alternativas para cuando no se puede hacer la rutina completa. */
    public Content alternative(String kind, int template, int minutes, String level, Preferences p) {
        return switch (kind) {
            case "walk" -> new Content("Caminata de 15 min", "Salí a caminar a un ritmo en el que puedas charlar.", 15,
                    List.of("Al aire libre", "Sin equipamiento"), "—", List.of(new Block("Caminata", 15, "Caminata", List.of(
                    new Exercise("Caminata suave para arrancar", "3 min"),
                    new Exercise("Caminata a ritmo cómodo y sostenido", "10 min"),
                    new Exercise("Bajar el ritmo y respirar", "2 min")))));
            case "liviana" -> new Content("Movilidad y caminata liviana", "Algo suave para moverte sin gastar energía de más.", 10,
                    List.of("Muy suave", "En casa"), "—", List.of(
                    new Block("Movilidad", 5, "Movilidad", List.of(new Exercise("Respiración profunda", "1 min"),
                            new Exercise("Movilidad de cuello y hombros", "2 min"), new Exercise("Gato-vaca", "2 min"))),
                    new Block("Caminata", 5, "Caminata", List.of(new Exercise("Caminata tranquila", "5 min")))));
            case "suave" -> new Content("Movilidad suave", "Movimientos muy tranquilos, sin cargar la zona que te molesta.", 10,
                    List.of("Muy suave", "Sin impacto"), "—", List.of(new Block("Movilidad suave", 10, "Movilidad suave", List.of(
                    new Exercise("Respiración diafragmática", "2 min"), new Exercise("Movilidad de cuello y hombros", "3 min"),
                    new Exercise("Estiramientos suaves", "3 min"), new Exercise("Relajación final", "2 min")))));
            case "sinequipo" -> {
                Content s = session(template, minutes, level, p);
                List<Block> blocks = s.blocks().stream().map(bl -> new Block(bl.name(), bl.minutes(), bl.summary(),
                        bl.items().stream().map(e -> new Exercise(e.name().replace(" con mancuerna", " con botellas de agua")
                                .replace(" con banda elástica", " con botellas de agua"), e.amount())).toList())).toList();
                yield new Content("Versión sin equipamiento", "Mismos músculos, solo con tu cuerpo.", s.minutes(),
                        List.of("Solo tu cuerpo", "En casa"), s.rest(), blocks);
            }
            default -> new Content("Versión exprés de tu rutina", "Activación y fuerza básica, sin colchoneta.", 10,
                    List.of("Bajo impacto", "En casa"), "30 s", List.of(
                    new Block("Activación", 3, "Activación", List.of(new Exercise("Caminata en el lugar", "2 min"), new Exercise("Círculos de brazos", "1 min"))),
                    new Block("Fuerza básica", 7, "Fuerza básica", List.of(new Exercise("Sentadilla a la silla", "2×10"),
                            new Exercise("Flexiones en pared", "2×10"), new Exercise("Puente de glúteos parado contra la pared", "2×12")))));
        };
    }

    /** Qué alternativa conviene según el motivo que contó la persona. */
    public static String alternativeFor(String reason) {
        return switch (reason == null ? "otro" : reason) {
            case "cansada" -> "liviana";
            case "dolor" -> "suave";
            case "equipo" -> "sinequipo";
            default -> "express";
        };
    }

    public static String proposalText(String reason) {
        return switch (reason == null ? "otro" : reason) {
            case "tiempo" -> "Como hoy no tuviste tiempo, lo hacemos más corto.";
            case "cansada" -> "Si estás con poca energía, mejor algo suave.";
            case "dolor" -> "Cuidarte también es progreso. Hoy vamos con algo muy suave.";
            case "equipo" -> "Sin equipamiento también se puede.";
            default -> "Hoy no se pudo, pasa. Te dejamos una versión más corta.";
        };
    }
}
