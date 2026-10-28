package com.wopfit.service;

import com.wopfit.entity.dto.WopiAskResponse;
import com.wopfit.entity.dto.WopiResponse;

/**
 * "Preguntale a Wopi": asistente con respuestas armadas por reglas (como en la v6) sobre los datos reales de la persona:
 * su rutina de hoy, su menú filtrado por lo que no come, su presupuesto, la lista del súper y su semana.
 * Respeta las restricciones del perfil, deriva a un profesional si algo duele y nunca reemplaza a uno.
 * Más adelante se puede cambiar `answer` por un modelo de IA sin tocar el resto.
 */
public interface WopiService {
    WopiResponse chat(Long userId);
    WopiAskResponse ask(Long userId, String question);
}
