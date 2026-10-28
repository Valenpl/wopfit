package com.wopfit.exceptions;

public class ConsultationNotFoundException extends NotFoundException {
    public ConsultationNotFoundException() {
        super("No encontramos esa consulta");
    }
}
