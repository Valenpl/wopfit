package com.wopfit.exceptions;

/** 503: Google Places no respondió (o rechazó la key), así que no hay lugares de Google para mostrar. */
public class PlacesUnavailableException extends RuntimeException {
    public PlacesUnavailableException(String message) {
        super(message);
    }
}
