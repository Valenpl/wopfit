package com.wopfit.controllers;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.NearbyPlaceResponse;
import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PlaceResponse;
import com.wopfit.service.PlaceService;

/** Lugares cercanos (Premium): aliados de demostración y lugares reales de Google. También las ofertas. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class PlaceController {
    private final PlaceService placeService;

    @GetMapping("/places")
    public ResponseEntity<List<PlaceResponse>> places(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(placeService.places(uid));
    }

    @GetMapping("/places/nearby")
    public ResponseEntity<List<NearbyPlaceResponse>> nearby(@AuthenticationPrincipal(expression = "id") Long uid,
            @RequestParam double lat, @RequestParam double lng) {
        return ResponseEntity.ok(placeService.nearby(uid, lat, lng));
    }

    @GetMapping("/offers")
    public ResponseEntity<OffersResponse> offers(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(placeService.offers(uid));
    }
}
