package com.wopfit.controllers.auth;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.service.AuthenticationService;

import jakarta.validation.Valid;

@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/auth")
public class AuthenticationController {
    private final AuthenticationService auth;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(r.email(), r.password()));
    }

    @PostMapping("/resend")
    public ResponseEntity<RegisterResponse> resend(@Valid @RequestBody ResendRequest r) {
        return ResponseEntity.ok(auth.resend(r.email()));
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthenticationResponse> verify(@Valid @RequestBody VerifyRequest r) {
        return ResponseEntity.ok(auth.verify(r.email(), r.code()));
    }

    @PostMapping("/forgot")
    public ResponseEntity<RegisterResponse> forgot(@Valid @RequestBody ResendRequest r) {
        return ResponseEntity.ok(auth.forgot(r.email()));
    }

    @PostMapping("/reset")
    public ResponseEntity<AuthenticationResponse> reset(@Valid @RequestBody ResetRequest r) {
        return ResponseEntity.ok(auth.reset(r.email(), r.code(), r.password()));
    }

    @PostMapping("/authenticate")
    public ResponseEntity<AuthenticationResponse> authenticate(@Valid @RequestBody AuthenticationRequest r) {
        return ResponseEntity.ok(auth.authenticate(r.email(), r.password()));
    }
}
