package com.wopfit.entity.dto;

import java.time.LocalDate;

public record Difficulty(LocalDate date, String kind, String label, String note) {}
