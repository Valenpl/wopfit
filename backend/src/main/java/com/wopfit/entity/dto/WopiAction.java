package com.wopfit.entity.dto;

/** kind: "go" (value = ruta del front), "ask" (value = pregunta), "meal" (value = "slot|comida") o "alt" (value = "sesión|alternativa"). */
public record WopiAction(String label, String kind, String value) {}
