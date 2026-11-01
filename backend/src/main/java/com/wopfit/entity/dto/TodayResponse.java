package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

import com.wopfit.service.support.WorkoutCatalog;

public record TodayResponse(LocalDate date, SessionResponse session, List<SessionResponse> next, WorkoutCatalog.Content alternativeToday) {}
