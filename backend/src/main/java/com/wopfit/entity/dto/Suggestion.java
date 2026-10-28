package com.wopfit.entity.dto;

import java.util.List;

public record Suggestion(String type, String text, String field, String from, String to, List<Struggle> struggles) {}
