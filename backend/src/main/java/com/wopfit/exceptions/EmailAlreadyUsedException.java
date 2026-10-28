package com.wopfit.exceptions;

public class EmailAlreadyUsedException extends ConflictException {
    public EmailAlreadyUsedException() {
        super("Ese email ya tiene una cuenta. Probá ingresar.");
    }
}
