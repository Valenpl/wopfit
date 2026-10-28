package com.wopfit.entity.dto;

import java.util.List;

public record MealResponse(int slot, String slotName, String time, String name, String ingredients, int price, String emoji,
        List<String> steps, List<String> tags, String status, String reason) {}
