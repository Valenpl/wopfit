package com.wopfit.entity.dto;

import java.time.LocalDate;

public record MeResponse(Long id, String email, String name, LocalDate birthDate, Integer heightCm, Double weightKg,
        boolean verified, PreferencesResponse preferences, PlanResponse plan, SubscriptionResponse subscription) {}
