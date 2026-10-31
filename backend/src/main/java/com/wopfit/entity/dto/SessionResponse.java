package com.wopfit.entity.dto;

import java.time.LocalDate;
import java.util.List;

import com.wopfit.service.WorkoutCatalog;

public record SessionResponse(Long id, LocalDate date, String status, int template, String title, int minutes,
        Integer feel, String reason, String reasonLabel, LocalDate movedTo, LocalDate movedFrom,
        String alternative, boolean alternativeDone, WorkoutCatalog.Content content, List<ExpertTip> tips) {}
