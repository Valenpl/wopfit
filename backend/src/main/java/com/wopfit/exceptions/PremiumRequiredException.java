package com.wopfit.exceptions;

public class PremiumRequiredException extends ForbiddenException {
    public PremiumRequiredException(String message) {
        super(message);
    }
}
