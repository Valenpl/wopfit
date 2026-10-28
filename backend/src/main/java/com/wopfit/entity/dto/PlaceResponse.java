package com.wopfit.entity.dto;

public record PlaceResponse(Long id, String name, String brand, String category, String categoryName, String address, String barrio,
        double lat, double lng, boolean openNow, String status, boolean discount, int offers) {}
