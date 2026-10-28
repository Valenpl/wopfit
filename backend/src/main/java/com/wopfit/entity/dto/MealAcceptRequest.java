package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;

/** `name`: la comida alternativa que eligió. */
public record MealAcceptRequest(@NotBlank(message = "Elegí una comida") String name) {}
