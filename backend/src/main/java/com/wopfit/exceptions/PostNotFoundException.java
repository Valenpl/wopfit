package com.wopfit.exceptions;

public class PostNotFoundException extends NotFoundException {
    public PostNotFoundException() {
        super("No encontramos esa publicación");
    }
}
