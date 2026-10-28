package com.wopfit.entity.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BookRequest(@NotNull(message = "Elegí el día") LocalDate date, @NotBlank(message = "Elegí el horario") String time,
        @NotBlank(message = "Elegí la modalidad") String mode) {}
