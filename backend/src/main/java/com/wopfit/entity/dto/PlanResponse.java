package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record PlanResponse(LocalDate startDate, List<Integer> days, int minutes, String level, String levelName,
        String trainingSummary, String foodSummary, List<String> healthNotes) {}
