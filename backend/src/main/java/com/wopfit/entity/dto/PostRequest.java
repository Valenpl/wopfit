package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** `photo`: data URL (image/jpeg, png o webp en base64), ya achicada en el celu. */
public record PostRequest(@NotBlank(message = "Elegí qué querés compartir") String type, @Size(max = 100, message = "Máximo 100 caracteres") String title,
        @Size(max = 1000, message = "Máximo 1000 caracteres") String body, String photo) {}
