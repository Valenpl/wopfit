package com.wopfit.exceptions;

public class GoalNotFoundException extends NotFoundException {
    public GoalNotFoundException() {
        super("No encontramos esa meta");
    }
}
