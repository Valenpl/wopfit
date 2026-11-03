package com.wopfit.service;

import java.util.List;

import com.wopfit.entity.dto.NearbyPlaceResponse;
import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PlaceResponse;

/**
 * Lugares cercanos (Premium) y cupones de aliados. Los aliados son de demostración; los de Google, reales.
 * La distancia la calcula el front. Para los lugares de Google llega la ubicación redondeada (unos 100 m) y no se guarda.
 */
public interface PlaceService {
    List<PlaceResponse> places(Long userId);
    OffersResponse offers(Long userId);
    List<NearbyPlaceResponse> nearby(Long userId, double lat, double lng);
}
