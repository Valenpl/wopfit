package com.wopfit.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Goal;
import com.wopfit.domain.HabitLog;
import com.wopfit.domain.MealLog;
import com.wopfit.domain.MealStatus;
import com.wopfit.domain.Plan;
import com.wopfit.domain.Preferences;
import com.wopfit.domain.SessionStatus;
import com.wopfit.domain.WorkoutSession;
import com.wopfit.repo.HabitLogRepository;
import com.wopfit.repo.MealLogRepository;
import com.wopfit.repo.WorkoutSessionRepository;
import com.wopfit.web.dto.Dtos.Difficulty;
import com.wopfit.web.dto.Dtos.HabitsDto;
import com.wopfit.web.dto.Dtos.HistoryDto;
import com.wopfit.web.dto.Dtos.HistoryWeek;
import com.wopfit.web.dto.Dtos.ObjectiveProgress;
import com.wopfit.web.dto.Dtos.PlanDto;
import com.wopfit.web.dto.Dtos.ProgressDto;
import com.wopfit.web.dto.Dtos.SessionDto;
import com.wopfit.web.dto.Dtos.Struggle;
import com.wopfit.web.dto.Dtos.Suggestion;
import com.wopfit.web.dto.Dtos.WeekDto;

/** Progreso, historial y ajustes automáticos del plan (alivianar cuando cuesta, crecer cuando va bien). */
@Service
public class ProgressService {
    private final PlanService plans;
    private final ProfileService profile;
    private final GoalService goals;
    private final WorkoutSessionRepository sessions;
    private final HabitLogRepository habits;
    private final MealLogRepository meals;
    private final TimeService time;

    public ProgressService(PlanService plans, ProfileService profile, GoalService goals, WorkoutSessionRepository sessions,
                           HabitLogRepository habits, MealLogRepository meals, TimeService time) {
        this.plans = plans;
        this.profile = profile;
        this.goals = goals;
        this.sessions = sessions;
        this.habits = habits;
        this.meals = meals;
        this.time = time;
    }

    private static boolean counts(WorkoutSession s) {
        return s.getStatus() == SessionStatus.DONE || s.isAlternativeDone();
    }

    /** Semanas completas seguidas (hacia atrás desde la anterior) en las que se cumplió todo lo planeado. */
    private int streak(Plan plan, Long userId) {
        LocalDate mon = TimeService.monday(time.today()).minusWeeks(1);
        LocalDate first = TimeService.monday(plan.getStartDate());
        int n = 0;
        while (!mon.isBefore(first)) {
            List<WorkoutSession> w = sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, mon, mon.plusDays(6));
            long total = w.stream().filter(s -> s.getStatus() != SessionStatus.MOVED).count();
            long done = w.stream().filter(ProgressService::counts).count();
            boolean struggled = w.stream().anyMatch(s -> s.getStatus() == SessionStatus.MOVED || s.getReason() != null);
            if (total == 0 || done < total || struggled) break;
            n++;
            mon = mon.minusWeeks(1);
        }
        return n;
    }

    private List<Struggle> struggles(Long userId) {
        LocalDate today = time.today();
        List<Struggle> out = new ArrayList<>();
        for (WorkoutSession s : sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, today.minusDays(7), today.minusDays(0))) {
            String st = plans.status(s);
            boolean hard = (s.getStatus() == SessionStatus.MOVED && s.getMovedFrom() == null) || "MISSED".equals(st)
                    || (s.getReason() != null && s.getStatus() != SessionStatus.DONE);
            if (hard) {
                String r = s.getReason() == null ? "otro" : s.getReason();
                out.add(new Struggle(s.getDate(), r, s.getReason() == null ? "No se registró" : Catalog.WORKOUT_REASONS.get(r)));
            }
        }
        return out;
    }

    private static int lighterMinutes(int m) {
        return Math.max(10, (int) (Math.round(m * 0.66 / 5.0) * 5));
    }

    private Suggestion suggestion(Plan plan, Long userId, int streak) {
        LocalDate mon = TimeService.monday(time.today());
        List<Struggle> st = struggles(userId);
        int idx = Math.max(0, Catalog.LEVEL_STEPS.indexOf(plan.getLevel()));
        if (st.size() >= 2 && !mon.equals(plan.getLightenSeenWeek())) {
            if (plan.getMinutes() > 10) {
                return new Suggestion("LIGHTEN", "Notamos que estas semanas costó. ¿Probamos sesiones más cortas por un tiempo?",
                        "minutes", plan.getMinutes() + " min", lighterMinutes(plan.getMinutes()) + " min", st);
            }
            if (idx > 0) {
                return new Suggestion("LIGHTEN", "Notamos que estas semanas costó. ¿Bajamos un poco la intensidad?", "level",
                        Catalog.levelName(plan.getLevel()), Catalog.levelName(Catalog.LEVEL_STEPS.get(idx - 1)), st);
            }
        }
        if (streak >= 1 && idx < Catalog.LEVEL_STEPS.size() - 1 && !mon.equals(plan.getAdjustSeenWeek())) {
            return new Suggestion("GROW", "¡Venís cumpliendo todo! ¿Subimos un escalón la intensidad?", "level",
                    Catalog.levelName(plan.getLevel()), Catalog.levelName(Catalog.LEVEL_STEPS.get(idx + 1)), List.of());
        }
        return null;
    }

    private List<ObjectiveProgress> objectives(Plan plan, Preferences p, Long userId) {
        LocalDate today = time.today();
        LocalDate from = plan.getStartDate();
        List<WorkoutSession> all = sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, from, today);
        long planned = all.stream().filter(s -> s.getStatus() != SessionStatus.MOVED).count();
        long done = all.stream().filter(ProgressService::counts).count();
        int train = planned == 0 ? 0 : (int) Math.min(100, Math.round(100.0 * done / planned));
        List<HabitLog> hab = habits.findByUserIdAndDateBetweenOrderByDateAsc(userId, from, today);
        long days = Math.max(1, java.time.temporal.ChronoUnit.DAYS.between(from, today) + 1);
        int sleep = (int) Math.round(100.0 * hab.stream().filter(HabitLog::isSleep).count() / days);
        int walk = (int) Math.round(100.0 * hab.stream().filter(HabitLog::isWalk).count() / days);
        int water = (int) Math.round(100.0 * hab.stream().filter(HabitLog::isWater).count() / days);
        List<MealLog> ml = meals.findByUserIdAndDateBetween(userId, from, today);
        long eaten = ml.stream().filter(m -> m.getStatus() == MealStatus.EATEN || m.getStatus() == MealStatus.ALTERNATIVE).count();
        int food = (int) Math.min(100, Math.round(100.0 * eaten / (days * 3)));

        List<Goal> gs = goals.entities(userId);
        List<ObjectiveProgress> out = new ArrayList<>();
        for (String code : Catalog.GOALS.keySet()) {
            if (!p.getGoals().contains(code)) continue;
            int base;
            String detail;
            switch (code) {
                case "comer" -> { base = (food + water) / 2; detail = eaten + " comidas del plan registradas"; }
                case "dormir" -> { base = sleep; detail = hab.stream().filter(HabitLog::isSleep).count() + " noches de buen descanso"; }
                case "estres" -> { base = (walk + train) / 2; detail = done + " entrenamientos y " + hab.stream().filter(HabitLog::isWalk).count() + " caminatas"; }
                case "peso" -> { base = (train + food) / 2; detail = done + " entrenamientos y " + eaten + " comidas del plan"; }
                default -> { base = train; detail = done + " de " + planned + " entrenamientos hechos"; }
            }
            List<Goal> mine = gs.stream().filter(g -> g.getObjective().equals(code)).toList();
            int pct = base;
            if (!mine.isEmpty()) {
                int metas = (int) Math.round(mine.stream().mapToInt(g -> goals.dto(g).objectivePercent()).average().orElse(0));
                pct = (base + metas) / 2;
                long cumplidas = mine.stream().filter(Goal::isDone).count();
                detail += " · " + cumplidas + " de " + mine.size() + (mine.size() == 1 ? " meta cumplida" : " metas cumplidas");
            }
            out.add(new ObjectiveProgress(code, Catalog.GOALS.get(code), pct, detail));
        }
        return out;
    }

    @Transactional
    public ProgressDto progress(Long userId) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        WeekDto week = plans.week(userId, time.today());
        HabitsDto h = HabitService.dto(habits.findByUserIdAndDate(userId, time.today()).orElse(null), time.today());
        int habitsToday = (h.water() ? 1 : 0) + (h.walk() ? 1 : 0) + (h.sleep() ? 1 : 0);
        int streak = streak(plan, userId);
        return new ProgressDto(week.weekNumber(), week.done(), week.total(), habitsToday, streak, objectives(plan, p, userId),
                suggestion(plan, userId, streak), week.days());
    }

    @Transactional
    public PlanDto lighten(Long userId) {
        Plan plan = plans.plan(userId);
        int idx = Math.max(0, Catalog.LEVEL_STEPS.indexOf(plan.getLevel()));
        if (plan.getMinutes() > 10) plan.setMinutes(lighterMinutes(plan.getMinutes()));
        else if (idx > 0) plan.setLevel(Catalog.LEVEL_STEPS.get(idx - 1));
        else throw ApiException.badRequest("Tu plan ya está en lo más liviano");
        plan.setLightenSeenWeek(TimeService.monday(time.today()));
        plan.setUpdatedAt(Instant.now());
        return ProfileService.planDto(plan, profile.prefs(userId));
    }

    @Transactional
    public PlanDto grow(Long userId) {
        Plan plan = plans.plan(userId);
        int idx = Math.max(0, Catalog.LEVEL_STEPS.indexOf(plan.getLevel()));
        if (idx >= Catalog.LEVEL_STEPS.size() - 1) throw ApiException.badRequest("Ya estás en el nivel más alto");
        plan.setLevel(Catalog.LEVEL_STEPS.get(idx + 1));
        plan.setAdjustSeenWeek(TimeService.monday(time.today()));
        plan.setUpdatedAt(Instant.now());
        return ProfileService.planDto(plan, profile.prefs(userId));
    }

    @Transactional
    public void dismiss(Long userId, String type) {
        Plan plan = plans.plan(userId);
        LocalDate mon = TimeService.monday(time.today());
        if ("LIGHTEN".equals(type)) plan.setLightenSeenWeek(mon);
        else plan.setAdjustSeenWeek(mon);
    }

    @Transactional
    public HistoryDto history(Long userId) {
        Plan plan = plans.plan(userId);
        Preferences p = profile.prefs(userId);
        LocalDate today = time.today();
        LocalDate first = TimeService.monday(plan.getStartDate());
        List<HistoryWeek> weeks = new ArrayList<>();
        for (LocalDate mon = TimeService.monday(today); !mon.isBefore(first); mon = mon.minusWeeks(1)) {
            LocalDate sun = mon.plusDays(6);
            List<WorkoutSession> w = sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, mon, sun);
            List<SessionDto> ss = w.stream().filter(s -> !s.getDate().isAfter(today)).map(s -> plans.dto(s, plan, p, false)).toList();
            int done = (int) w.stream().filter(ProgressService::counts).count();
            int total = (int) w.stream().filter(s -> s.getStatus() != SessionStatus.MOVED).count();
            List<HabitsDto> hs = habits.findByUserIdAndDateBetweenOrderByDateAsc(userId, mon, sun).stream()
                    .map(x -> HabitService.dto(x, x.getDate())).toList();
            weeks.add(new HistoryWeek(mon, plans.weekNumber(plan, mon), done, total, ss, hs));
        }
        List<Difficulty> diffs = new ArrayList<>();
        for (WorkoutSession s : sessions.findByUserIdOrderByDateDesc(userId)) {
            if (s.getReason() == null) continue;
            diffs.add(new Difficulty(s.getDate(), "WORKOUT", Catalog.WORKOUT_REASONS.get(s.getReason()), s.getReasonNote()));
        }
        for (MealLog m : meals.findByUserIdAndReasonIsNotNullOrderByDateDesc(userId)) {
            diffs.add(new Difficulty(m.getDate(), "MEAL", Catalog.MEAL_REASONS.get(m.getReason()), Catalog.SLOTS.get(m.getSlot())));
        }
        diffs.sort(Comparator.comparing(Difficulty::date).reversed());
        Map<String, Integer> count = new HashMap<>();
        for (Difficulty d : diffs) count.merge(d.label(), 1, Integer::sum);
        String most = count.entrySet().stream().max(Map.Entry.comparingByValue()).map(Map.Entry::getKey).orElse(null);
        return new HistoryDto(weeks, diffs, most, most == null ? 0 : count.get(most));
    }
}
