package com.wopfit.controllers.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyRequest(@NotBlank @Email String email,
        @NotBlank @Pattern(regexp = "\\d{6}", message = "El código tiene 6 números") String code) {}
