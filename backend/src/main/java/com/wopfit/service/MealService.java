package com.wopfit.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.MealLog;
import com.wopfit.domain.MealStatus;
import com.wopfit.domain.Offer;
import com.wopfit.domain.Plan;
import com.wopfit.domain.Preferences;
import com.wopfit.domain.ShoppingCheck;
import com.wopfit.repo.MealLogRepository;
import com.wopfit.repo.OfferRepository;
import com.wopfit.repo.ShoppingCheckRepository;
import com.wopfit.service.MealCatalog.Meal;
import com.wopfit.web.dto.Dtos.MealDayDto;
import com.wopfit.web.dto.Dtos.MealDto;
import com.wopfit.web.dto.Dtos.MealProposalDto;
import com.wopfit.web.dto.Dtos.ShoppingDto;
import com.wopfit.web.dto.Dtos.ShoppingItem;

/** Plan de comidas: qué toca en cada momento del día, registros y alternativas. */
@Service
public class MealService {
    private static final String[] TIMES = {"8:00", "13:00", "20:30"};

    private final MealLogRepository logs;
    private final ShoppingCheckRepository checks;
    private final OfferRepository offers;
    private final MealCatalog catalog;
    private final ProfileService profile;
    private final PlanService plans;

    public MealService(MealLogRepository logs, ShoppingCheckRepository checks, OfferRepository offers, MealCatalog catalog, ProfileService profile, PlanService plans) {
        this.logs = logs;
        this.checks = checks;
        this.offers = offers;
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
        int cost = weekMeals(userId, plan, p, TimeService.monday(date)).stream().mapToInt(Meal::price).sum();
        return new MealDayDto(date, meals, cost, budgetMax(p.getBudget()));
    }

    /** Las comidas de la semana que arranca el lunes indicado, sin las que marcaste "no pude". */
    private List<Meal> weekMeals(Long userId, Plan plan, Preferences p, LocalDate monday) {
        List<MealLog> week = logs.findByUserIdAndDateBetween(userId, monday, monday.plusDays(6));
        List<Meal> out = new ArrayList<>();
        for (int d = 0; d < 7; d++) {
            LocalDate day = monday.plusDays(d);
            for (int slot = 0; slot < 3; slot++) {
                final int s = slot;
                MealLog log = week.stream().filter(x -> x.getDate().equals(day) && x.getSlot() == s).findFirst().orElse(null);
                if (log != null && log.getStatus() == MealStatus.SKIPPED) continue;
                out.add(mealFor(plan, p, day, slot, log));
            }
        }
        return out;
    }

    /** Ingredientes de la semana, de los que más se usan a los que menos. */
    private static Map<String, Integer> ingredients(List<Meal> meals) {
        Map<String, Integer> count = new HashMap<>();
        for (Meal m : meals) {
            for (String part : m.ingredients().split(",")) {
                String n = part.trim().toLowerCase(Locale.ROOT);
                if (!n.isEmpty() && !n.contains("lo que tengas")) count.merge(n, 1, Integer::sum);
            }
        }
        Map<String, Integer> sorted = new LinkedHashMap<>();
        count.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .forEach(e -> sorted.put(e.getKey(), e.getValue()));
        return sorted;
    }

    /** Lista del súper de la semana de `date`, con lo que ya marcaste como comprado. */
    @Transactional(readOnly = true)
    public ShoppingDto shopping(Long userId, LocalDate date) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        LocalDate monday = TimeService.monday(date);
        List<Meal> meals = weekMeals(userId, plan, p, monday);
        Set<String> checked = new HashSet<>();
        checks.findByUserIdAndWeek(userId, monday).forEach(c -> checked.add(c.getItem()));
        List<Offer> all = offers.findAll();
        List<ShoppingItem> items = ingredients(meals).entrySet().stream()
                .map(e -> new ShoppingItem(e.getKey(), e.getValue(), checked.contains(e.getKey()), all.stream().anyMatch(o -> o.covers(e.getKey()))))
                .toList();
        return new ShoppingDto(monday, meals.stream().mapToInt(Meal::price).sum(), budgetMax(p.getBudget()), items);
    }

    /** Los ingredientes de la lista de la semana de `date` (para saber qué ofertas te sirven). */
    @Transactional(readOnly = true)
    public Set<String> weekIngredients(Long userId, LocalDate date) {
        return ingredients(weekMeals(userId, plans.plan(userId), profile.prefs(userId), TimeService.monday(date))).keySet();
    }

    @Transactional
    public ShoppingDto check(Long userId, LocalDate date, String name, boolean on) {
        LocalDate monday = TimeService.monday(date);
        String item = name.trim().toLowerCase(Locale.ROOT);
        if (!ingredients(weekMeals(userId, plans.plan(userId), profile.prefs(userId), monday)).containsKey(item)) {
            throw ApiException.badRequest("Ese ingrediente no está en tu lista de la semana");
        }
        var current = checks.findByUserIdAndWeekAndItem(userId, monday, item);
        if (on && current.isEmpty()) {
            ShoppingCheck c = new ShoppingCheck();
            c.setUser(profile.user(userId));
            c.setWeek(monday);
            c.setItem(item);
            checks.save(c);
        } else if (!on) {
            current.ifPresent(checks::delete);
        }
        return shopping(userId, monday);
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
