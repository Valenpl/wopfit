package com.wopfit.entity.dto;

import java.util.List;

/** `alerts`: con Premium se avisa cuando hay ofertas para tu lista. */
public record OffersResponse(boolean alerts, List<OfferResponse> offers) {}
