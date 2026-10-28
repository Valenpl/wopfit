package com.wopfit.exceptions;

public class WorkoutNotFoundException extends NotFoundException {
    public WorkoutNotFoundException() {
        super("No encontramos ese entrenamiento");
    }
}
