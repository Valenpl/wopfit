package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record MealReportRequest(@NotBlank String reason) {}
