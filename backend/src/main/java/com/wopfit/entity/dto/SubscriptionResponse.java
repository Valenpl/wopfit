package com.wopfit.entity.dto;

import java.time.LocalDate;

/** `demo` siempre es true: Premium se activa sin pagar. */
public record SubscriptionResponse(boolean premium, String period, String periodName, LocalDate until, boolean demo, int consultsLeft, int wopiLeft) {}
