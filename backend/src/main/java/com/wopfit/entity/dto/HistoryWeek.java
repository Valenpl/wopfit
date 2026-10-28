package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record HistoryWeek(LocalDate monday, int weekNumber, int done, int total, List<SessionResponse> sessions, List<HabitsResponse> habits) {}
