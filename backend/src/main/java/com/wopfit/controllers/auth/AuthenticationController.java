package com.wopfit.controllers.auth;


import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.ResendRequest;
import com.wopfit.entity.dto.AuthResponse;
import com.wopfit.entity.dto.LoginRequest;
import com.wopfit.entity.dto.RegisterRequest;
import com.wopfit.entity.dto.RegisterResponse;
import com.wopfit.entity.dto.VerifyRequest;
import com.wopfit.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthenticationController {
    private final AuthService auth;

    public AuthenticationController(AuthService auth) {
        this.auth = auth;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auth.register(r.email(), r.password()));
    }

    @PostMapping("/resend")
    public ResponseEntity<RegisterResponse> resend(@RequestBody ResendRequest r) {
        return ResponseEntity.ok(auth.resend(r.email() == null ? "" : r.email()));
    }

    @PostMapping("/verify")
    public ResponseEntity<AuthResponse> verify(@Valid @RequestBody VerifyRequest r) {
        return ResponseEntity.ok(auth.verify(r.email(), r.code()));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest r) {
        return ResponseEntity.ok(auth.login(r.email(), r.password()));
    }
}
