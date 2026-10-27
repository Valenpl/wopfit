package com.wopfit.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Subscription;
import com.wopfit.repo.ConsultationRepository;
import com.wopfit.repo.SubscriptionRepository;
import com.wopfit.repo.UserRepository;
import com.wopfit.web.dto.Dtos.SubscriptionDto;

/** Plan Gratuito o Premium. Es una demostración: se activa sin pagar y se puede volver al Gratuito cuando quieras. */
@Service
public class PremiumService {
    /** Consultas con profesionales incluidas por mes. */
    public static final int CONSULTS_PER_MONTH = 2;

    private final SubscriptionRepository subs;
    private final UserRepository users;
    private final ConsultationRepository consults;
    private final TimeService time;

    public PremiumService(SubscriptionRepository subs, UserRepository users, ConsultationRepository consults, TimeService time) {
        this.subs = subs;
        this.users = users;
        this.consults = consults;
        this.time = time;
    }

    private static int months(String period) {
        if (period == null || !Catalog.PREMIUM_PERIODS.containsKey(period)) throw ApiException.badRequest("Elegí mensual, semestral o anual");
        return switch (period) {
            case "mensual" -> 1;
            case "semestral" -> 6;
            default -> 12;
        };
    }

    private Subscription active(Long userId) {
        return subs.findByUserId(userId).filter(s -> !s.getUntil().isBefore(time.today())).orElse(null);
    }

    public boolean isPremium(Long userId) {
        return active(userId) != null;
    }

    /** Consultas que le quedan este mes (cuentan las reservadas en el mes). Sin Premium, 0. */
    public int consultsLeft(Long userId) {
        if (!isPremium(userId)) return 0;
        LocalDate first = time.today().withDayOfMonth(1);
        long used = consults.countByUserIdAndBookedOnBetween(userId, first, first.plusMonths(1).minusDays(1));
        return (int) Math.max(0, CONSULTS_PER_MONTH - used);
    }

    public SubscriptionDto status(Long userId) {
        Subscription s = active(userId);
        if (s == null) return new SubscriptionDto(false, null, null, null, true, 0);
        return new SubscriptionDto(true, s.getPeriod(), Catalog.PREMIUM_PERIODS.get(s.getPeriod()), s.getUntil(), true, consultsLeft(userId));
    }

    /** Activa (o cambia de período) desde hoy. */
    @Transactional
    public SubscriptionDto activate(Long userId, String period) {
        int m = months(period);
        LocalDate today = time.today();
        Subscription s = subs.findByUserId(userId).orElseGet(() -> {
            Subscription n = new Subscription();
            n.setUser(users.getReferenceById(userId));
            return n;
        });
        s.setPeriod(period);
        s.setStartDate(today);
        s.setUntil(today.plusMonths(m));
        subs.save(s);
        return status(userId);
    }

    @Transactional
    public SubscriptionDto cancel(Long userId) {
        subs.findByUserId(userId).ifPresent(subs::delete);
        return status(userId);
    }
}
