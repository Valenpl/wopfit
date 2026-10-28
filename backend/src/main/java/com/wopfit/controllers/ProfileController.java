package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.AboutRequest;
import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.entity.dto.PasswordRequest;
import com.wopfit.entity.dto.PreferencesRequest;
import com.wopfit.service.AuthenticationService;
import com.wopfit.service.ProfileService;

import jakarta.validation.Valid;

/** Datos del usuario, preferencias y contraseña. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/me")
public class ProfileController {
    private final ProfileService profile;
    private final AuthenticationService auth;

    @GetMapping
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(profile.me(uid));
    }

    @PutMapping("/about")
    public ResponseEntity<MeResponse> about(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody AboutRequest r) {
        return ResponseEntity.ok(profile.updateAbout(uid, r));
    }

    @PutMapping("/preferences")
    public ResponseEntity<MeResponse> preferences(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody PreferencesRequest r) {
        return ResponseEntity.ok(profile.updatePreferences(uid, r));
    }

    @PutMapping("/password")
    public ResponseEntity<MessageResponse> password(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody PasswordRequest r) {
        auth.changePassword(uid, r.current(), r.password());
        return ResponseEntity.ok(new MessageResponse("Contraseña actualizada"));
    }
}
