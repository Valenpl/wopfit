package com.wopfit.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.wopfit.domain.Preferences;

/** Recetas del plan. flags: l = lácteos, g = gluten, c = carne/pescado. Precio en pesos por porción. */
@Component
public class MealCatalog {

    public record Meal(String name, String ingredients, int price, String flags, String emoji, List<String> steps) {}

    private static Meal m(String n, String ing, int price, String flags, String emoji, String steps) {
        return new Meal(n, ing, price, flags, emoji, List.of(steps.split("\\|")));
    }

    public static final List<List<Meal>> MEALS = List.of(
        List.of( // desayuno
            m("Avena cocida con banana y canela", "Avena, banana, canela", 700, "g", "🥣", "Hervé la avena 5 min en agua|Agregá la banana en rodajas|Terminá con canela"),
            m("Licuado de banana con tostadas de arroz", "Banana, bebida vegetal, galletas de arroz", 900, "", "🍌", "Licuá la banana con la bebida vegetal|Acompañá con 3 galletas de arroz"),
            m("Huevos revueltos con tomate y arepa", "Huevo, tomate, harina de maíz", 1000, "", "🍳", "Armá la arepa y dorala 4 min por lado|Revolvé los huevos con el tomate|Serví todo junto"),
            m("Yogur con granola y frutilla", "Yogur natural, granola, frutilla", 1100, "lg", "🍓", "Serví el yogur|Sumá la granola y la frutilla cortada"),
            m("Tostadas integrales con huevo y palta", "Pan integral, huevo, palta", 1200, "g", "🥑", "Tostá el pan|Pisá la palta con sal y limón|Sumá el huevo a la plancha")),
        List.of( // almuerzo
            m("Arroz yamaní salteado con vegetales y huevo", "Arroz yamaní, zanahoria, zapallito, huevo", 1600, "", "🍚", "Cociná el arroz (o usá el del día anterior)|Salteá las verduras en cubitos|Sumá el huevo y mezclá"),
            m("Tarta de verduras con ensalada", "Masa, acelga, queso, huevo, lechuga", 1800, "gl", "🥧", "Salteá la acelga|Mezclá con huevo y queso|Horneá 30 min en la masa"),
            m("Fideos integrales con tomate y atún", "Fideos integrales, tomate, atún", 1900, "gc", "🍝", "Hervé los fideos|Calentá el tomate con el atún|Mezclá y serví"),
            m("Bowl de lentejas, arroz y zapallo", "Lentejas, arroz, zapallo, cebolla", 2100, "", "🥗", "Hervé las lentejas 20 min|Asá el zapallo en cubos|Armá el bowl con el arroz y la cebolla salteada"),
            m("Pollo al horno con papas y ensalada", "Pollo, papa, tomate, lechuga", 2600, "c", "🍗", "Condimentá el pollo|Horneá 40 min con las papas|Serví con ensalada"),
            m("Milanesa de carne con puré", "Carne, pan rallado, papa, leche", 2800, "cgl", "🥩", "Empaná la carne|Horneá 20 min|Hacé el puré con leche")),
        List.of( // cena
            m("Sopa crema de calabaza con tostadas", "Calabaza, cebolla, pan", 1200, "g", "🥣", "Hervé la calabaza con la cebolla|Procesá hasta que quede cremosa|Acompañá con tostadas"),
            m("Guiso de garbanzos y verduras", "Garbanzos, papa, morrón, zanahoria", 1500, "", "🍲", "Rehogá las verduras|Sumá papa, garbanzos y agua|Cociná 25 min"),
            m("Hamburguesas de lentejas con ensalada", "Lentejas, avena, lechuga, tomate", 1700, "g", "🍔", "Pisá las lentejas con avena|Formá las hamburguesas|Dorálas 4 min por lado"),
            m("Omelette de espinaca con ensalada", "Huevo, espinaca, tomate, lechuga", 1800, "", "🍳", "Batí los huevos|Sumá la espinaca y cociná a fuego bajo|Serví con ensalada"),
            m("Wok de verduras con tofu y arroz", "Tofu, brócoli, morrón, arroz", 2000, "", "🥦", "Dorá el tofu en cubos|Salteá las verduras a fuego fuerte|Serví sobre el arroz"),
            m("Pescado a la plancha con calabaza", "Merluza, calabaza, limón", 3200, "c", "🐟", "Asá la calabaza|Cociná la merluza 3 min por lado|Terminá con limón")));

    private static final List<Meal> ALT_TIEMPO = List.of(
            m("Wrap de atún y verduras", "Tortilla de maíz, atún, tomate, lechuga", 900, "c", "🌯", "Abrí el atún|Armá el wrap con las verduras|Listo en 5 minutos"),
            m("Ensalada de garbanzos de lata", "Garbanzos, tomate, cebolla, limón", 800, "", "🥗", "Enjuagá los garbanzos|Mezclá con el tomate y la cebolla|Condimentá con limón"));
    private static final List<Meal> ALT_INGRED = List.of(
            m("Huevos revueltos con arroz y verduras", "Huevo, arroz, lo que tengas en la heladera", 700, "", "🍳", "Usá arroz del día anterior|Salteá las verduras que tengas|Sumá los huevos"));
    private static final List<Meal> ALT_AFUERA = List.of(
            m("Cena liviana: sopa de verduras", "Zapallo, zanahoria, cebolla, papa", 900, "", "🍲", "Hervé las verduras 20 min|Procesá o serví en trozos"));
    private static final List<Meal> ALT_HAMBRE = List.of(
            m("Snack liviano: fruta y galletas de arroz", "Fruta de estación, galletas de arroz", 500, "", "🍎", "Elegí una fruta|Acompañá con 2 galletas de arroz"));

    public boolean fits(Meal meal, Preferences p) {
        Set<String> av = p.getAvoid();
        if (av.contains("lacteos") && meal.flags().contains("l")) return false;
        if ((av.contains("gluten") || av.contains("tacc")) && meal.flags().contains("g")) return false;
        if (av.contains("tacc") && meal.ingredients().toLowerCase().contains("avena")) return false;
        if (av.contains("carne") && meal.flags().contains("c")) return false;
        String other = p.getOtherAvoid() == null ? "" : p.getOtherAvoid().trim().toLowerCase();
        return other.isEmpty() || !(meal.name() + " " + meal.ingredients()).toLowerCase().contains(other);
    }

    /** Opciones de un momento del día, filtradas por restricciones y ordenadas por precio según presupuesto. */
    public List<Meal> options(int slot, Preferences p) {
        List<Meal> o = new ArrayList<>(MEALS.get(slot).stream().filter(x -> fits(x, p)).toList());
        if (o.isEmpty()) o = new ArrayList<>(MEALS.get(slot).subList(0, 2));
        o.sort(Comparator.comparingInt(Meal::price));
        if ("bajo".equals(p.getBudget())) o = new ArrayList<>(o.subList(0, Math.min(o.size(), Math.max(2, (o.size() + 1) / 2))));
        if ("medio".equals(p.getBudget()) && o.size() > 3) o = new ArrayList<>(o.subList(0, o.size() - 1));
        return o;
    }

    public Meal alternative(String reason, int slot, Preferences p) {
        if ("caro".equals(reason)) return options(slot, p).get(0);
        List<Meal> list = switch (reason == null ? "" : reason) {
            case "ingred" -> ALT_INGRED;
            case "afuera" -> ALT_AFUERA;
            case "hambre" -> ALT_HAMBRE;
            default -> ALT_TIEMPO;
        };
        return list.stream().filter(x -> fits(x, p)).findFirst().orElse(ALT_INGRED.get(0));
    }

    public Meal byName(String name) {
        for (List<Meal> l : MEALS) for (Meal x : l) if (x.name().equals(name)) return x;
        for (List<Meal> l : List.of(ALT_TIEMPO, ALT_INGRED, ALT_AFUERA, ALT_HAMBRE)) for (Meal x : l) if (x.name().equals(name)) return x;
        return null;
    }

    public List<String> tags(Meal meal, Preferences p) {
        List<String> t = new ArrayList<>();
        if (p.getAvoid().contains("lacteos")) t.add("Sin lácteos");
        if (p.getAvoid().contains("tacc")) t.add("Sin TACC");
        else if (p.getAvoid().contains("gluten")) t.add("Sin gluten");
        if (p.getAvoid().contains("carne")) t.add("Sin carne");
        if (p.getHealth().contains("diabetes")) t.add("Sin azúcar agregada");
        if (p.getHealth().contains("presion")) t.add("Bajo en sal");
        if (t.isEmpty()) t.add(meal.price() <= 1200 ? "Económico" : "Equilibrado");
        return t;
    }

    public static String proposalText(String reason) {
        return switch (reason == null ? "otro" : reason) {
            case "tiempo" -> "Sin tiempo para cocinar: una versión de 5 minutos, sin hornalla.";
            case "ingred" -> "Armamos algo con lo que seguro tenés en casa.";
            case "afuera" -> "No pasa nada. Equilibramos el día con algo liviano.";
            case "caro" -> "Te proponemos la opción más económica de tu plan.";
            case "hambre" -> "Escuchar a tu cuerpo está bien. Algo chiquito para no llegar con mucha hambre.";
            default -> "Te dejamos una opción rápida y simple.";
        };
    }
}
