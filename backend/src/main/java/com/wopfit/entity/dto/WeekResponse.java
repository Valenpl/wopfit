package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

public record WeekResponse(LocalDate monday, int weekNumber, int done, int total, List<DayResponse> days) {}
