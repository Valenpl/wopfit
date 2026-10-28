package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PasswordRequest(@NotBlank(message = "Escribí tu contraseña actual") String current,
        @NotBlank @Size(min = 8, message = "Mínimo 8 caracteres") @Pattern(regexp = ".*\\d.*", message = "Tiene que tener al menos un número") String password) {}
