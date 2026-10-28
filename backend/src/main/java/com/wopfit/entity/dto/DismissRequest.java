package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** `type`: la sugerencia que se descarta ("LIGHTEN" o "GROW"). */
public record DismissRequest(@NotNull @Pattern(regexp = "LIGHTEN|GROW", message = "Tiene que ser LIGHTEN o GROW") String type) {}
