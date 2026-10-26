package com.wopfit.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.MealLog;
import com.wopfit.domain.MealStatus;
import com.wopfit.domain.Plan;
import com.wopfit.domain.Preferences;
import com.wopfit.repo.MealLogRepository;
import com.wopfit.service.MealCatalog.Meal;
import com.wopfit.web.dto.Dtos.MealDayDto;
import com.wopfit.web.dto.Dtos.MealDto;
import com.wopfit.web.dto.Dtos.MealProposalDto;

/** Plan de comidas: qué toca en cada momento del día, registros y alternativas. */
@Service
public class MealService {
    private static final String[] TIMES = {"8:00", "13:00", "20:30"};

    private final MealLogRepository logs;
    private final MealCatalog catalog;
    private final ProfileService profile;
    private final PlanService plans;

    public MealService(MealLogRepository logs, MealCatalog catalog, ProfileService profile, PlanService plans) {
        this.logs = logs;
        this.catalog = catalog;
        this.profile = profile;
        this.plans = plans;
    }

    private static void checkSlot(int slot) {
        if (slot < 0 || slot > 2) throw ApiException.badRequest("Momento del día no válido");
    }

    /** La comida que toca: la elegida como alternativa, o una rotación del menú según el día y los cambios pedidos. */
    private Meal mealFor(Plan plan, Preferences p, LocalDate date, int slot, MealLog log) {
        if (log != null && log.getAlternativeName() != null) {
            Meal m = catalog.byName(log.getAlternativeName());
            if (m != null) return m;
        }
        List<Meal> opts = catalog.options(slot, p);
        long base = Math.max(0, ChronoUnit.DAYS.between(plan.getStartDate(), date));
        int swaps = log == null ? 0 : log.getSwaps();
        int i = (int) Math.floorMod(base * (slot + 2) + slot * 2L + swaps, (long) opts.size());
        return opts.get(i);
    }

    private MealDto dto(Meal m, Preferences p, int slot, MealLog log) {
        return new MealDto(slot, Catalog.SLOTS.get(slot), TIMES[slot], m.name(), m.ingredients(), m.price(), m.emoji(), m.steps(),
                catalog.tags(m, p), log == null || log.getStatus() == null ? "PENDING" : log.getStatus().name(),
                log == null ? null : log.getReason());
    }

    private static int budgetMax(String budget) {
        return switch (budget == null ? "" : budget) {
            case "bajo" -> 25000;
            case "alto" -> 70000;
            default -> 45000;
        };
    }

    @Transactional(readOnly = true)
    public MealDayDto day(Long userId, LocalDate date) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        List<MealDto> meals = new ArrayList<>();
        for (int slot = 0; slot < 3; slot++) {
            MealLog log = logs.findByUserIdAndDateAndSlot(userId, date, slot).orElse(null);
            meals.add(dto(mealFor(plan, p, date, slot, log), p, slot, log));
        }
        LocalDate monday = TimeService.monday(date);
        List<MealLog> week = logs.findByUserIdAndDateBetween(userId, monday, monday.plusDays(6));
        int cost = 0;
        for (int d = 0; d < 7; d++) {
            LocalDate day = monday.plusDays(d);
            for (int slot = 0; slot < 3; slot++) {
                final int s = slot;
                MealLog log = week.stream().filter(x -> x.getDate().equals(day) && x.getSlot() == s).findFirst().orElse(null);
                if (log != null && log.getStatus() == MealStatus.SKIPPED) continue;
                cost += mealFor(plan, p, day, slot, log).price();
            }
        }
        return new MealDayDto(date, meals, cost, budgetMax(p.getBudget()));
    }

    private MealLog log(Long userId, LocalDate date, int slot) {
        return logs.findByUserIdAndDateAndSlot(userId, date, slot).orElseGet(() -> {
            MealLog l = new MealLog();
            l.setUser(profile.user(userId));
            l.setDate(date);
            l.setSlot(slot);
            return l;
        });
    }

    @Transactional
    public MealDayDto eaten(Long userId, LocalDate date, int slot) {
        checkSlot(slot);
        MealLog l = log(userId, date, slot);
        l.setStatus(l.getAlternativeName() != null ? MealStatus.ALTERNATIVE : MealStatus.EATEN);
        logs.save(l);
        return day(userId, date);
    }

    /** "No pude": guarda el motivo y propone una alternativa (todavía no la aplica). */
    @Transactional
    public MealProposalDto report(Long userId, LocalDate date, int slot, String reason) {
        checkSlot(slot);
        if (!Catalog.MEAL_REASONS.containsKey(reason)) throw ApiException.badRequest("Elegí un motivo");
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        MealLog l = log(userId, date, slot);
        l.setReason(reason);
        logs.save(l);
        Meal current = mealFor(plan, p, date, slot, l);
        Meal alt = catalog.alternative(reason, slot, p);
        if (alt.name().equals(current.name())) {
            List<Meal> opts = catalog.options(slot, p);
            alt = opts.stream().filter(x -> !x.name().equals(current.name())).findFirst().orElse(alt);
        }
        return new MealProposalDto(MealCatalog.proposalText(reason), dto(current, p, slot, l), dto(alt, p, slot, null));
    }

    @Transactional
    public MealDayDto accept(Long userId, LocalDate date, int slot, String name) {
        checkSlot(slot);
        Meal m = catalog.byName(name);
        if (m == null) throw ApiException.badRequest("No encontramos esa comida");
        MealLog l = log(userId, date, slot);
        l.setAlternativeName(m.name());
        l.setStatus(MealStatus.ALTERNATIVE);
        logs.save(l);
        return day(userId, date);
    }

    @Transactional
    public MealDayDto skip(Long userId, LocalDate date, int slot) {
        checkSlot(slot);
        MealLog l = log(userId, date, slot);
        l.setStatus(MealStatus.SKIPPED);
        logs.save(l);
        return day(userId, date);
    }

    /** "Cambiar comida": pasa a la próxima opción del menú. */
    @Transactional
    public MealDayDto swap(Long userId, LocalDate date, int slot) {
        checkSlot(slot);
        MealLog l = log(userId, date, slot);
        l.setSwaps(l.getSwaps() + 1);
        l.setAlternativeName(null);
        if (l.getStatus() == MealStatus.ALTERNATIVE) l.setStatus(null);
        logs.save(l);
        return day(userId, date);
    }
}
