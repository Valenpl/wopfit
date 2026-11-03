package com.wopfit.entity.dto;

/**
 * Un lugar real de Google Places (gimnasio, parque, súper o tienda deportiva).
 * id es el place_id de Google. openNow es null si Google no tiene el horario.
 */
public record NearbyPlaceResponse(String id, String name, String category, String categoryName, String address,
        double lat, double lng, Boolean openNow, String status) {}
