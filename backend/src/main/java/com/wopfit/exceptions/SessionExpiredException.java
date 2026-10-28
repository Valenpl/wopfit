package com.wopfit.exceptions;

public class SessionExpiredException extends UnauthorizedException {
    public SessionExpiredException() {
        super("Tu sesión venció. Volvé a ingresar.");
    }
}
