package com.wopfit.exceptions;

public class SlotTakenException extends ConflictException {
    public SlotTakenException() {
        super("Ese turno ya está ocupado. Elegí otro horario.");
    }
}
