package com.wopfit.controllers.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.AuthResponse;
import com.wopfit.entity.dto.LoginRequest;
import com.wopfit.entity.dto.RegisterRequest;
import com.wopfit.entity.dto.RegisterResponse;
import com.wopfit.entity.dto.VerifyRequest;
import com.wopfit.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api")
public class AuthenticationController {
    private final AuthService auth;

    public AuthenticationController(AuthService auth) {
        this.auth = auth;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        return Map.of("status", "ok");
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public RegisterResponse register(@Valid @RequestBody RegisterRequest r) {
        return auth.register(r.email(), r.password());
    }

    @PostMapping("/auth/resend")
    public RegisterResponse resend(@RequestBody Map<String, String> body) {
        return auth.resend(body.getOrDefault("email", ""));
    }

    @PostMapping("/auth/verify")
    public AuthResponse verify(@Valid @RequestBody VerifyRequest r) {
        return auth.verify(r.email(), r.code());
    }

    @PostMapping("/auth/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest r) {
        return auth.login(r.email(), r.password());
    }
}
