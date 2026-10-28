package com.wopfit.exceptions;

public class InvalidCredentialsException extends UnauthorizedException {
    public InvalidCredentialsException() {
        super("El email o la contraseña no coinciden");
    }
}
