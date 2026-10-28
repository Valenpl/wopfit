package com.wopfit.controllers.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank(message = "Escribí tu email") @Email(message = "Revisá el formato del email") String email,
        @NotBlank @Size(min = 8, message = "Mínimo 8 caracteres") @Pattern(regexp = ".*\\d.*", message = "Tiene que tener al menos un número") String password) {}
