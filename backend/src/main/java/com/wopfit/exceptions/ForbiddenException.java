package com.wopfit.exceptions;

/** 403: Hay sesión, pero no tiene permiso para esta acción. */
public abstract class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}
