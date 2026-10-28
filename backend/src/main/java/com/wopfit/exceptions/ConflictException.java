package com.wopfit.exceptions;

/** 409: La acción choca con el estado actual (duplicado, límite usado, turno ocupado). */
public abstract class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
