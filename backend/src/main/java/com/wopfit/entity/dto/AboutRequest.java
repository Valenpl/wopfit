package com.wopfit.entity.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

public record AboutRequest(
        @NotBlank(message = "Contanos cómo te llamamos") @Size(max = 80) String name,
        @NotNull(message = "Completá tu fecha de nacimiento") @Past LocalDate birthDate,
        @Min(value = 100, message = "La altura va en centímetros") @Max(230) Integer heightCm,
        @DecimalMin(value = "30", message = "El peso va en kilos") @DecimalMax("300") Double weightKg) {}
