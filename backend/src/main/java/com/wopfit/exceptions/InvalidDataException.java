package com.wopfit.exceptions;

/** 400: Los datos que mandó el usuario no sirven para esta acción. */
public class InvalidDataException extends RuntimeException {
    public InvalidDataException(String message) {
        super(message);
    }
}
