package com.wopfit.entity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoalRequest(@NotBlank String objective, @NotBlank @Size(max = 120) String what,
        @Min(1) @Max(7) int timesPerWeek, @Min(1) @Max(12) int weeks) {}
