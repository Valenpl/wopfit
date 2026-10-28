package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record MealDayResponse(LocalDate date, List<MealResponse> meals, int weekCost, int budgetMax) {}
