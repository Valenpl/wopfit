package com.wopfit.exceptions;

public class UserNotFoundException extends NotFoundException {
    public UserNotFoundException() {
        super("No encontramos una cuenta con ese email");
    }
}
