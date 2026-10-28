package com.wopfit.entity.dto;

import java.time.LocalDate;

public record HabitsResponse(LocalDate date, boolean water, boolean walk, boolean sleep) {}
