package com.wopfit.entity.dto;

/** Respuesta de un DELETE: el id de lo que se borró, así el front lo saca del store sin volver a pedir la lista. */
public record DeleteResponse(Long id, String message) {}
