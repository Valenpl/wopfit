package com.wopfit.exceptions;

/** 404: Lo que se pidió no existe (o no es del usuario). */
public abstract class NotFoundException extends RuntimeException {
    public NotFoundException(String message) {
        super(message);
    }
}
