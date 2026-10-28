package com.wopfit.service;

import com.wopfit.entity.dto.SubscriptionResponse;

/** Plan Gratuito o Premium. Es una demostración: se activa sin pagar y se puede volver al Gratuito cuando quieras. */
public interface PremiumService {
    /** Consultas con profesionales incluidas por mes. */
    int CONSULTS_PER_MONTH = 2;
    /** Preguntas a Wopi por mes. */
    int WOPI_FREE = 3, WOPI_PREMIUM = 20;

    boolean isPremium(Long userId);
    int consultsLeft(Long userId);
    /** Igual que consultsLeft(userId), cuando ya se sabe si es Premium: no vuelve a buscar la suscripción. */
    int consultsLeft(Long userId, boolean premium);
    String monthKey();
    int wopiLimit(boolean premium);
    int wopiLeft(Long userId);
    /** Igual que wopiLeft(userId), cuando ya se sabe si es Premium. */
    int wopiLeft(Long userId, boolean premium);
    SubscriptionResponse status(Long userId);
    SubscriptionResponse activate(Long userId, String period);
    SubscriptionResponse cancel(Long userId);
}
