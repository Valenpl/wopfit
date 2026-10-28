package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;

public record SubscriptionRequest(@NotBlank(message = "Elegí cada cuánto") String period) {}
