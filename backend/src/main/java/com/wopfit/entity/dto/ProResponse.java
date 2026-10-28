package com.wopfit.entity.dto;

import java.time.LocalDate;

public record ProResponse(Long id, String kind, String name, String specialty, String license, double rating, String experience, String bio,
        LocalDate nextDate, String nextTime) {}
