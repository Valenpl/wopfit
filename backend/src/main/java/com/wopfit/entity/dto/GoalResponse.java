package com.wopfit.entity.dto;

import java.time.LocalDate;

public record GoalResponse(Long id, String objective, String objectiveName, String what, int timesPerWeek, int weeks,
        LocalDate startDate, int currentWeek, int doneThisWeek, boolean checkedToday, boolean done, LocalDate doneAt,
        int objectivePercent) {}
