package com.wopfit.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Valores válidos y etiquetas para mostrar. Los códigos son los que viajan en la API. */
public final class Catalog {
    private Catalog() {}

    public static final Map<String, String> GOALS = ordered(
            "mover", "Moverme más", "comer", "Comer mejor", "peso", "Bajar de peso",
            "fuerza", "Ganar fuerza", "dormir", "Dormir mejor", "estres", "Reducir estrés");
    public static final Map<String, String> ACTIVITIES = ordered(
            "caminar", "Caminar", "correr", "Correr", "yoga", "Yoga", "pesas", "Pesas", "bici", "Bici", "baile", "Baile");
    /** Alimentos que se evitan. "tacc" es celiaquía: además del gluten saca la avena. */
    public static final Map<String, String> AVOID = ordered(
            "lacteos", "Sin lácteos", "gluten", "Sin gluten", "tacc", "Sin TACC", "carne", "Sin carne");
    public static final Map<String, String> HEALTH = ordered(
            "diabetes", "Diabetes", "presion", "Presión alta", "embarazo", "Embarazo", "lesion", "Lesión o dolor crónico");
    public static final Map<String, String> EQUIPMENT = ordered(
            "nada", "Solo mi cuerpo", "mancuernas", "Mancuernas", "banda", "Banda elástica",
            "colchoneta", "Colchoneta", "gym", "Gimnasio completo");
    public static final Map<String, String> LEVELS = ordered(
            "principiante", "Principiante", "intermedio", "Intermedio", "avanzado", "Avanzado");
    /** Escalones del plan: crece o se aliviana de a uno. */
    public static final List<String> LEVEL_STEPS = List.of("principiante", "principiante+", "intermedio", "intermedio+", "avanzado");
    public static final Map<String, String> BUDGETS = ordered(
            "bajo", "Bajo · $15.000 a $25.000 por semana", "medio", "Medio · $25.000 a $45.000 por semana", "alto", "Alto · más de $45.000 por semana");
    public static final Map<String, String> WORKOUT_REASONS = ordered(
            "tiempo", "No tuve tiempo", "cansada", "Estaba cansada/o", "dolor", "Me dolía algo",
            "equipo", "No tenía el equipamiento", "otro", "Otro motivo");
    public static final Map<String, String> MEAL_REASONS = ordered(
            "tiempo", "No tuve tiempo de cocinar", "ingred", "No tenía los ingredientes", "afuera", "Comí afuera",
            "caro", "Era caro para mi presupuesto", "hambre", "No tenía hambre", "otro", "Otro motivo");
    public static final List<String> SLOTS = List.of("Desayuno", "Almuerzo", "Cena");
    /** Categorías del mapa "Cerca tuyo" y de los cupones. */
    public static final Map<String, String> PLACE_CATEGORIES = ordered(
            "super", "Supermercados", "diet", "Dietéticas", "verdu", "Verdulerías", "gym", "Gimnasios", "parque", "Parques");
    public static final Map<String, String> OFFER_CATEGORIES = ordered(
            "super", "Supermercados", "diet", "Dietéticas", "gym", "Gimnasios", "ropa", "Ropa deportiva", "supl", "Suplementos");
    /** Períodos de Premium (demostración, sin cobros). */
    public static final Map<String, String> PREMIUM_PERIODS = ordered("mensual", "Mensual", "semestral", "Semestral", "anual", "Anual");
    public static final Map<String, List<String>> GOAL_OPTIONS = Map.of(
            "mover", List.of("Caminar 20 min", "Entrenar 30 min", "Estirar 10 min"),
            "comer", List.of("Cocinar en casa", "Comer 2 frutas", "Tomar 2 L de agua"),
            "peso", List.of("Caminar 30 min", "Cocinar en casa", "Evitar ultraprocesados"),
            "fuerza", List.of("Entrenar fuerza 30 min", "Sumar proteína en cada comida", "Estirar 10 min"),
            "dormir", List.of("Dormir 7 h", "Sin pantallas 30 min antes de dormir", "Cenar liviano"),
            "estres", List.of("Respirar 5 min", "Caminar 20 min", "Pausa activa 10 min"));

    public static String levelName(String step) {
        return switch (step == null ? "" : step) {
            case "principiante+" -> "Principiante +";
            case "intermedio" -> "Intermedio";
            case "intermedio+" -> "Intermedio +";
            case "avanzado" -> "Avanzado";
            default -> "Principiante";
        };
    }

    private static Map<String, String> ordered(String... kv) {
        Map<String, String> m = new LinkedHashMap<>();
        for (int i = 0; i < kv.length; i += 2) m.put(kv[i], kv[i + 1]);
        return Collections.unmodifiableMap(m);
    }
}
