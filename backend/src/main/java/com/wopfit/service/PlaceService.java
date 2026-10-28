package com.wopfit.service;

import java.util.List;

import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PlaceResponse;

/**
 * Lugares cercanos (Premium) y cupones de aliados, todo de demostración.
 * La distancia la calcula el front con la ubicación del celu: la ubicación nunca viaja al servidor.
 */
public interface PlaceService {
    List<PlaceResponse> places(Long userId);
    OffersResponse offers(Long userId);
}
