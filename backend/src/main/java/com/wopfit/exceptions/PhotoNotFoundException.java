package com.wopfit.exceptions;

public class PhotoNotFoundException extends NotFoundException {
    public PhotoNotFoundException() {
        super("No encontramos esa foto");
    }
}
