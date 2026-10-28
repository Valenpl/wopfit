package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotNull;

public record ToggleRequest(@NotNull Boolean on) {}
