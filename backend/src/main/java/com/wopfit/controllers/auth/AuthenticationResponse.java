package com.wopfit.controllers.auth;

import com.wopfit.entity.dto.MeResponse;

/** El token y el usuario: así el front no tiene que pedir GET /me después de entrar. */
public record AuthenticationResponse(String token, MeResponse me) {}
