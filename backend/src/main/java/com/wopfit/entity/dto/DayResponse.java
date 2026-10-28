package com.wopfit.entity.dto;

import java.time.LocalDate;

public record DayResponse(LocalDate date, boolean today, SessionResponse session) {}
