package com.wopfit.entity.dto;

public record MealProposalResponse(String text, MealResponse current, MealResponse alternative) {}
