package com.wopfit.entity.dto;

import java.util.Set;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record PreferencesRequest(
        @NotEmpty(message = "Elegí al menos un objetivo") Set<String> goals,
        @NotEmpty(message = "Elegí al menos un día") Set<@Min(0) @Max(6) Integer> days,
        @Min(10) @Max(90) int minutes,
        @NotBlank String budget,
        Set<String> activities,
        Set<String> avoid,
        @Size(max = 80) String otherAvoid,
        Set<String> health,
        @NotBlank String level,
        Set<String> equipment) {}
