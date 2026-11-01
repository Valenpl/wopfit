package com.wopfit.entity.dto;

/** Una foto de la comunidad: el tipo (image/jpeg, image/png...) y los bytes para mandar tal cual. */
public record PhotoResponse(String contentType, byte[] data) {}
