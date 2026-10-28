package com.wopfit.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PlaceResponse;
import com.wopfit.service.PlaceService;

/** Lugares cercanos (Premium) y ofertas, con datos de demostración. */
@RestController
@RequestMapping("/api/v1")
public class PlaceController {
    private final PlaceService placeService;

    public PlaceController(PlaceService placeService) {
        this.placeService = placeService;
    }

    @GetMapping("/places")
    public ResponseEntity<List<PlaceResponse>> places(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(placeService.places(uid));
    }

    @GetMapping("/offers")
    public ResponseEntity<OffersResponse> offers(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(placeService.offers(uid));
    }
}
