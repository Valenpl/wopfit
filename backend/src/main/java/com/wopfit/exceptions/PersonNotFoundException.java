package com.wopfit.exceptions;

public class PersonNotFoundException extends NotFoundException {
    public PersonNotFoundException() {
        super("No encontramos a esa persona");
    }
}
