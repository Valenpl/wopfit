package com.wopfit.entity.dto;

import java.util.List;

public record PersonResponse(Long id, String name, List<String> goals, String sharedGoal, int daysPerWeek, boolean following) {}
