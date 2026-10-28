package com.wopfit.entity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ResendRequest(@NotBlank(message = "Escribí tu email") @Email(message = "Revisá el formato del email") String email) {}
