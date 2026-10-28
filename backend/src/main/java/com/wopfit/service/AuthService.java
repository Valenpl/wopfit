package com.wopfit.service;

import com.wopfit.entity.dto.AuthResponse;
import com.wopfit.entity.dto.RegisterResponse;

public interface AuthService {
    RegisterResponse register(String email, String password);
    RegisterResponse resend(String email);
    AuthResponse verify(String email, String code);
    void changePassword(Long userId, String current, String password);
    AuthResponse login(String email, String password);
}
