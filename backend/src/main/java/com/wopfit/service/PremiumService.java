package com.wopfit.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Subscription;
import com.wopfit.repo.ConsultationRepository;
import com.wopfit.repo.SubscriptionRepository;
import com.wopfit.repo.WopiMessageRepository;
import com.wopfit.repo.UserRepository;
import com.wopfit.web.dto.Dtos.SubscriptionDto;

/** Plan Gratuito o Premium. Es una demostración: se activa sin pagar y se puede volver al Gratuito cuando quieras. */
@Service
public class PremiumService {
    /** Consultas con profesionales incluidas por mes. */
    public static final int CONSULTS_PER_MONTH = 2;
    /** Preguntas a Wopi por mes. */
    public static final int WOPI_FREE = 3, WOPI_PREMIUM = 20;

    private final SubscriptionRepository subs;
    private final UserRepository users;
    private final ConsultationRepository consults;
    private final WopiMessageRepository wopi;
    private final TimeService time;

    public PremiumService(SubscriptionRepository subs, UserRepository users, ConsultationRepository consults, WopiMessageRepository wopi,
                          TimeService time) {
        this.subs = subs;
        this.users = users;
        this.consults = consults;
        this.wopi = wopi;
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

    public String monthKey() {
        return time.today().toString().substring(0, 7);
    }

    public int wopiLimit(Long userId) {
        return isPremium(userId) ? WOPI_PREMIUM : WOPI_FREE;
    }

    /** Preguntas a Wopi que le quedan este mes: 3 con el plan Gratuito, 20 con Premium. */
    public int wopiLeft(Long userId) {
        return (int) Math.max(0, wopiLimit(userId) - wopi.countByUserIdAndMonthAndRole(userId, monthKey(), "user"));
    }

    public SubscriptionDto status(Long userId) {
        Subscription s = active(userId);
        if (s == null) return new SubscriptionDto(false, null, null, null, true, 0, wopiLeft(userId));
        return new SubscriptionDto(true, s.getPeriod(), Catalog.PREMIUM_PERIODS.get(s.getPeriod()), s.getUntil(), true, consultsLeft(userId), wopiLeft(userId));
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
