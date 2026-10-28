package com.wopfit.entity.dto;

/** `left`: consultas que te quedan este mes después de cancelar. */
public record CancelResponse(Long id, String message, int left) {}
