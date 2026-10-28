package com.wopfit.entity.dto;

import java.time.LocalDate;

public record Difficulty(Long id, LocalDate date, String kind, String label, String note) {}
