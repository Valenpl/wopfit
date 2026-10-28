package com.wopfit.exceptions;

public class EmailNotVerifiedException extends ForbiddenException {
    public EmailNotVerifiedException() {
        super("Verificá tu email antes de ingresar");
    }
}
