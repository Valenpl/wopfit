package com.wopfit.exceptions;

/** 401: No hay sesión válida o las credenciales no coinciden. */
public abstract class UnauthorizedException extends RuntimeException {
    public UnauthorizedException(String message) {
        super(message);
    }
}
