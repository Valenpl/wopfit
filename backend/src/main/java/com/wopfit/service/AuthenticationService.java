package com.wopfit.service;

import com.wopfit.controllers.auth.AuthenticationResponse;
import com.wopfit.controllers.auth.RegisterResponse;

public interface AuthenticationService {
    RegisterResponse register(String email, String password);
    RegisterResponse resend(String email);
    AuthenticationResponse verify(String email, String code);
    RegisterResponse forgot(String email);
    AuthenticationResponse reset(String email, String code, String password);
    void changePassword(Long userId, String current, String password);
    AuthenticationResponse authenticate(String email, String password);
}
