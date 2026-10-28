package com.wopfit.entity.dto;

import java.util.List;

public record OfferResponse(Long id, String code, String store, String category, String categoryName, String off, String unit,
        String description, int daysLeft, List<String> ingredients, boolean forList, List<Branch> branches) {}
