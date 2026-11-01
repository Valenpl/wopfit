package com.wopfit.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.Subscription;
import com.wopfit.entity.dto.SubscriptionResponse;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.repository.ConsultationRepository;
import com.wopfit.repository.SubscriptionRepository;
import com.wopfit.repository.UserRepository;
import com.wopfit.repository.WopiMessageRepository;
import com.wopfit.service.support.Catalog;

@RequiredArgsConstructor
@Service
public class PremiumServiceImpl implements PremiumService {
    private final SubscriptionRepository subs;
    private final UserRepository users;
    private final ConsultationRepository consults;
    private final WopiMessageRepository wopi;
    private final TimeService time;

    private static int months(String period) {
        if (period == null || !Catalog.PREMIUM_PERIODS.containsKey(period)) throw new InvalidDataException("Elegí mensual, semestral o anual");
        return switch (period) {
            case "mensual" -> 1;
            case "semestral" -> 6;
            default -> 12;
        };
    }

    private Subscription active(Long userId) {
        return subs.findByUserId(userId).filter(s -> !s.getUntil().isBefore(time.today())).orElse(null);
    }

    @Override
    public boolean isPremium(Long userId) {
        return active(userId) != null;
    }

    /** Consultas que le quedan este mes (cuentan las reservadas en el mes). Sin Premium, 0. */
    @Override
    public int consultsLeft(Long userId) {
        return consultsLeft(userId, isPremium(userId));
    }

    @Override
    public int consultsLeft(Long userId, boolean premium) {
        if (!premium) return 0;
        LocalDate first = time.today().withDayOfMonth(1);
        long used = consults.countByUserIdAndBookedOnBetween(userId, first, first.plusMonths(1).minusDays(1));
        return (int) Math.max(0, CONSULTS_PER_MONTH - used);
    }

    @Override
    public String monthKey() {
        return time.today().toString().substring(0, 7);
    }

    @Override
    public int wopiLimit(boolean premium) {
        return premium ? WOPI_PREMIUM : WOPI_FREE;
    }

    /** Preguntas a Wopi que le quedan este mes: 3 con el plan Gratuito, 20 con Premium. */
    @Override
    public int wopiLeft(Long userId) {
        return wopiLeft(userId, isPremium(userId));
    }

    @Override
    public int wopiLeft(Long userId, boolean premium) {
        return (int) Math.max(0, wopiLimit(premium) - wopi.countByUserIdAndMonthAndRole(userId, monthKey(), "user"));
    }

    /** Estado del plan para /me: una sola consulta a la suscripción. */
    @Override
    public SubscriptionResponse status(Long userId) {
        Subscription s = active(userId);
        boolean premium = s != null;
        return new SubscriptionResponse(premium, premium ? s.getPeriod() : null, premium ? Catalog.PREMIUM_PERIODS.get(s.getPeriod()) : null,
                premium ? s.getUntil() : null, true, consultsLeft(userId, premium), wopiLeft(userId, premium));
    }

    /** Activa (o cambia de período) desde hoy. */
    @Transactional
    @Override
    public SubscriptionResponse activate(Long userId, String period) {
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
    @Override
    public SubscriptionResponse cancel(Long userId) {
        subs.findByUserId(userId).ifPresent(subs::delete);
        return status(userId);
    }
}
