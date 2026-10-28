package com.wopfit.exceptions;

public class LimitReachedException extends ConflictException {
    public LimitReachedException(String message) {
        super(message);
    }
}
