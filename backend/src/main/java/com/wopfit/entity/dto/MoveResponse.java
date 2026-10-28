package com.wopfit.entity.dto;

import java.time.LocalDate;

public record MoveResponse(SessionResponse session, LocalDate movedTo, String message) {}
