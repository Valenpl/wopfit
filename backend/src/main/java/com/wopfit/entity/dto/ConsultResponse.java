package com.wopfit.entity.dto;

import java.time.LocalDate;

public record ConsultResponse(Long id, Long proId, String proName, String specialty, LocalDate date, String time, String mode) {}
