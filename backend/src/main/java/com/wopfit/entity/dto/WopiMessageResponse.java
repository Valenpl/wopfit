package com.wopfit.entity.dto;

import java.util.List;

/** `text` puede traer **negrita**. `more` = se puede pedir "Dame otras opciones". */
public record WopiMessageResponse(Long id, String role, String text, List<WopiCard> cards, List<WopiAction> actions, boolean more) {}
