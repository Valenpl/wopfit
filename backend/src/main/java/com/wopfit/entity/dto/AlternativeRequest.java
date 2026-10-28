package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record AlternativeRequest(@NotBlank String kind) {}
