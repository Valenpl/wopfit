package com.wopfit.entity.dto;

import java.util.List;

/** `left`: consultas que te quedan este mes (0 sin Premium); `limit`: las que trae Premium. */
public record ProsResponse(boolean premium, int left, int limit, List<ConsultResponse> mine, List<ProResponse> pros) {}
