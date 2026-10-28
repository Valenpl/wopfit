package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotNull;

public record HabitsRequest(@NotNull Boolean water, @NotNull Boolean walk, @NotNull Boolean sleep) {}
