package com.wopfit.entity.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record DoneRequest(@Min(0) @Max(4) Integer feel, @Size(max = 300) String note) {}
