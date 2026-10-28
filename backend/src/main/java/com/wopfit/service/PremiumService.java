package com.wopfit.service;

import com.wopfit.entity.dto.SubscriptionResponse;

/** Plan Gratuito o Premium. Es una demostración: se activa sin pagar y se puede volver al Gratuito cuando quieras. */
public interface PremiumService {
    int CONSULTS_PER_MONTH = 2;
    int WOPI_FREE = 3, WOPI_PREMIUM = 20;

    boolean isPremium(Long userId);
    int consultsLeft(Long userId);
    String monthKey();
    int wopiLimit(Long userId);
    int wopiLeft(Long userId);
    SubscriptionResponse status(Long userId);
    SubscriptionResponse activate(Long userId, String period);
    SubscriptionResponse cancel(Long userId);
}
