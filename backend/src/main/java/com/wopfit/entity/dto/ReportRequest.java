package com.wopfit.entity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ReportRequest(@NotBlank(message = "Contanos qué pasó") String reason, @Size(max = 300) String note) {}
