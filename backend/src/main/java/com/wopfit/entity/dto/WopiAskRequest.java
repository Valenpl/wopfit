package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WopiAskRequest(@NotBlank(message = "Escribile algo a Wopi") @Size(max = 300, message = "Máximo 300 caracteres") String text) {}
