package com.wopfit.entity.dto;

import java.util.List;

public record ProgressResponse(int weekNumber, int sessionsDone, int sessionsTotal, int habitsToday, int weeksStreak,
        List<ObjectiveProgress> objectives, Suggestion suggestion, List<DayResponse> week) {}
