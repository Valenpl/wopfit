package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.AboutRequest;
import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.entity.dto.PasswordRequest;
import com.wopfit.entity.dto.PreferencesRequest;
import com.wopfit.service.AuthService;
import com.wopfit.service.ProfileService;

import jakarta.validation.Valid;

/** Datos del usuario, preferencias y contraseña. */
@RestController
@RequestMapping("/api/v1/me")
public class ProfileController {
    private final ProfileService profile;
    private final AuthService auth;

    public ProfileController(ProfileService profile, AuthService auth) {
        this.profile = profile;
        this.auth = auth;
    }

    @GetMapping
    public ResponseEntity<MeResponse> me(@AuthenticationPrincipal Long uid) {
        return ResponseEntity.ok(profile.me(uid));
    }

    @PutMapping("/about")
    public ResponseEntity<MeResponse> about(@AuthenticationPrincipal Long uid, @Valid @RequestBody AboutRequest r) {
        return ResponseEntity.ok(profile.updateAbout(uid, r));
    }

    @PutMapping("/preferences")
    public ResponseEntity<MeResponse> preferences(@AuthenticationPrincipal Long uid, @Valid @RequestBody PreferencesRequest r) {
        return ResponseEntity.ok(profile.updatePreferences(uid, r));
    }

    @PutMapping("/password")
    public ResponseEntity<MessageResponse> password(@AuthenticationPrincipal Long uid, @Valid @RequestBody PasswordRequest r) {
        auth.changePassword(uid, r.current(), r.password());
        return ResponseEntity.ok(new MessageResponse("Contraseña actualizada"));
    }
}
