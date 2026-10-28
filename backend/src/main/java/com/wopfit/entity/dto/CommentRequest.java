package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommentRequest(@NotBlank(message = "Escribí un comentario") @Size(max = 300, message = "Máximo 300 caracteres") String text) {}
