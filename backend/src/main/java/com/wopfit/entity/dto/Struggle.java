package com.wopfit.entity.dto;

import java.time.LocalDate;

public record Struggle(LocalDate date, String reason, String reasonLabel) {}
