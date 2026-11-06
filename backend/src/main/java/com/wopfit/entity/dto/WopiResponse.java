package com.wopfit.entity.dto;

import java.util.List;

/** `ai`: si Wopi responde con IA (hay API key) o con las reglas de siempre. */
public record WopiResponse(boolean premium, int left, int limit, boolean ai, List<WopiMessageResponse> messages) {}
