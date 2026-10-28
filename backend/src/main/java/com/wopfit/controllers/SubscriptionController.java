package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.SubscriptionRequest;
import com.wopfit.service.PremiumService;
import com.wopfit.service.ProfileService;

import jakarta.validation.Valid;

/** Premium de demostración: se activa y se cancela sin cobros. */
@RestController
@RequestMapping("/api/v1/subscription")
public class SubscriptionController {
    private final ProfileService profile;
    private final PremiumService premium;

    public SubscriptionController(ProfileService profile, PremiumService premium) {
        this.profile = profile;
        this.premium = premium;
    }

    @PostMapping
    public ResponseEntity<MeResponse> subscribe(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody SubscriptionRequest r) {
        premium.activate(uid, r.period());
        return ResponseEntity.ok(profile.me(uid));
    }

    @DeleteMapping
    public ResponseEntity<MeResponse> unsubscribe(@AuthenticationPrincipal(expression = "id") Long uid) {
        premium.cancel(uid);
        return ResponseEntity.ok(profile.me(uid));
    }
}
