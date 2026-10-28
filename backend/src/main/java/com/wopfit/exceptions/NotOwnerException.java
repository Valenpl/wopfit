package com.wopfit.exceptions;

public class NotOwnerException extends ForbiddenException {
    public NotOwnerException() {
        super("Solo podés borrar tus publicaciones");
    }
}
