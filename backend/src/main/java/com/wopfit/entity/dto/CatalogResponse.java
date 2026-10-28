package com.wopfit.entity.dto;

import java.util.List;
import java.util.Map;

/** Opciones para los formularios: código → nombre para mostrar. */
public record CatalogResponse(Map<String, String> goals, Map<String, String> activities, Map<String, String> avoid,
        Map<String, String> health, Map<String, String> equipment, Map<String, String> levels, Map<String, String> budgets,
        Map<String, String> workoutReasons, Map<String, String> mealReasons, Map<String, List<String>> goalOptions,
        Map<String, String> premiumPeriods, Map<String, String> placeCategories, Map<String, String> offerCategories) {}
