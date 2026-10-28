package com.wopfit.exceptions;

public class ProfessionalNotFoundException extends NotFoundException {
    public ProfessionalNotFoundException() {
        super("No encontramos ese profesional");
    }
}
