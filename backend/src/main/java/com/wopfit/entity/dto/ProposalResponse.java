package com.wopfit.entity.dto;

import java.time.LocalDate;

import com.wopfit.service.support.WorkoutCatalog;

public record ProposalResponse(String text, String kind, WorkoutCatalog.Content alternative, LocalDate nextDate) {}
