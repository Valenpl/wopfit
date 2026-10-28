package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record ShoppingCheckRequest(@NotBlank String name, boolean checked) {}
