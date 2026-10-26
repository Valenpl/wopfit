package com.wopfit.web;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.service.Catalog;
import com.wopfit.service.GoalService;
import com.wopfit.service.HabitService;
import com.wopfit.service.MealService;
import com.wopfit.service.PlanService;
import com.wopfit.service.ProfileService;
import com.wopfit.service.ProgressService;
import com.wopfit.web.dto.Dtos.AboutRequest;
import com.wopfit.web.dto.Dtos.AlternativeRequest;
import com.wopfit.web.dto.Dtos.DoneRequest;
import com.wopfit.web.dto.Dtos.GoalDto;
import com.wopfit.web.dto.Dtos.GoalRequest;
import com.wopfit.web.dto.Dtos.HabitsDto;
import com.wopfit.web.dto.Dtos.HistoryDto;
import com.wopfit.web.dto.Dtos.MealDayDto;
import com.wopfit.web.dto.Dtos.MealProposalDto;
import com.wopfit.web.dto.Dtos.MealReportRequest;
import com.wopfit.web.dto.Dtos.Me;
import com.wopfit.web.dto.Dtos.Message;
import com.wopfit.web.dto.Dtos.MoveResponse;
import com.wopfit.web.dto.Dtos.PlanDto;
import com.wopfit.web.dto.Dtos.PlanUpdateResponse;
import com.wopfit.web.dto.Dtos.PreferencesRequest;
import com.wopfit.web.dto.Dtos.ProgressDto;
import com.wopfit.web.dto.Dtos.ReportRequest;
import com.wopfit.web.dto.Dtos.ReportResponse;
import com.wopfit.web.dto.Dtos.SessionDto;
import com.wopfit.web.dto.Dtos.TodayDto;
import com.wopfit.web.dto.Dtos.WeekDto;

import jakarta.validation.Valid;

/** Todo lo que necesita una sesión iniciada. El usuario sale del token (principal = id). */
@RestController
@RequestMapping("/api")
public class MeController {
    private final ProfileService profile;
    private final PlanService plans;
    private final MealService meals;
    private final HabitService habits;
    private final GoalService goals;
    private final ProgressService progress;

    public MeController(ProfileService profile, PlanService plans, MealService meals, HabitService habits, GoalService goals,
                        ProgressService progress) {
        this.profile = profile;
        this.plans = plans;
        this.meals = meals;
        this.habits = habits;
        this.goals = goals;
        this.progress = progress;
    }

    // ---- catálogo (opciones para los formularios) ----
    @GetMapping("/catalog")
    public Map<String, Object> catalog() {
        return Map.of("goals", Catalog.GOALS, "activities", Catalog.ACTIVITIES, "avoid", Catalog.AVOID, "health", Catalog.HEALTH,
                "equipment", Catalog.EQUIPMENT, "levels", Catalog.LEVELS, "budgets", Catalog.BUDGETS,
                "workoutReasons", Catalog.WORKOUT_REASONS, "mealReasons", Catalog.MEAL_REASONS, "goalOptions", Catalog.GOAL_OPTIONS);
    }

    // ---- perfil ----
    @GetMapping("/me")
    public Me me(@AuthenticationPrincipal Long uid) { return profile.me(uid); }

    @PutMapping("/me/about")
    public Me about(@AuthenticationPrincipal Long uid, @Valid @RequestBody AboutRequest r) { return profile.updateAbout(uid, r); }

    @PutMapping("/me/preferences")
    public Me preferences(@AuthenticationPrincipal Long uid, @Valid @RequestBody PreferencesRequest r) {
        return profile.updatePreferences(uid, r);
    }

    // ---- plan ----
    @PostMapping("/plan")
    public PlanUpdateResponse createPlan(@AuthenticationPrincipal Long uid) { return plans.createOrUpdate(uid); }

    @GetMapping("/plan")
    public PlanDto plan(@AuthenticationPrincipal Long uid) { return plans.get(uid); }

    // ---- entrenamientos ----
    @GetMapping("/workouts/today")
    public TodayDto today(@AuthenticationPrincipal Long uid) { return plans.today(uid); }

    @GetMapping("/workouts/week")
    public WeekDto week(@AuthenticationPrincipal Long uid,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return plans.week(uid, start);
    }

    @GetMapping("/workouts/{id}")
    public SessionDto session(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return plans.session(uid, id); }

    @PostMapping("/workouts/{id}/report")
    public ReportResponse report(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody ReportRequest r) {
        return plans.report(uid, id, r.reason(), r.note());
    }

    @PostMapping("/workouts/{id}/accept-alternative")
    public MoveResponse accept(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody AlternativeRequest r) {
        return plans.acceptAlternative(uid, id, r.kind());
    }

    @PostMapping("/workouts/{id}/rest")
    public MoveResponse rest(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return plans.rest(uid, id); }

    @PostMapping("/workouts/{id}/reschedule")
    public MoveResponse reschedule(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return plans.reschedule(uid, id); }

    @PostMapping("/workouts/{id}/done")
    public SessionDto done(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody(required = false) DoneRequest r) {
        return plans.done(uid, id, r == null ? null : r.feel(), r == null ? null : r.note());
    }

    // ---- comidas ----
    @GetMapping("/meals/{date}")
    public MealDayDto mealDay(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return meals.day(uid, date);
    }

    @PostMapping("/meals/{date}/{slot}/eaten")
    public MealDayDto eaten(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                            @PathVariable int slot) {
        return meals.eaten(uid, date, slot);
    }

    @PostMapping("/meals/{date}/{slot}/report")
    public MealProposalDto mealReport(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @PathVariable int slot, @Valid @RequestBody MealReportRequest r) {
        return meals.report(uid, date, slot, r.reason());
    }

    @PostMapping("/meals/{date}/{slot}/accept")
    public MealDayDto mealAccept(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                 @PathVariable int slot, @RequestBody Map<String, String> body) {
        return meals.accept(uid, date, slot, body.getOrDefault("name", ""));
    }

    @PostMapping("/meals/{date}/{slot}/skip")
    public MealDayDto skip(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return meals.skip(uid, date, slot);
    }

    @PostMapping("/meals/{date}/{slot}/swap")
    public MealDayDto swap(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return meals.swap(uid, date, slot);
    }

    // ---- hábitos ----
    @GetMapping("/habits/{date}")
    public HabitsDto habits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return habits.get(uid, date);
    }

    @PutMapping("/habits/{date}")
    public HabitsDto setHabits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                               @RequestBody HabitsDto body) {
        return habits.set(uid, date, body);
    }

    // ---- metas ----
    @GetMapping("/goals")
    public List<GoalDto> goals(@AuthenticationPrincipal Long uid) { return goals.list(uid); }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalDto createGoal(@AuthenticationPrincipal Long uid, @Valid @RequestBody GoalRequest r) { return goals.create(uid, r); }

    @PostMapping("/goals/{id}/check")
    public GoalDto check(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return goals.check(uid, id); }

    @DeleteMapping("/goals/{id}")
    public Message deleteGoal(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        goals.delete(uid, id);
        return new Message("Meta eliminada");
    }

    // ---- progreso ----
    @GetMapping("/progress")
    public ProgressDto progress(@AuthenticationPrincipal Long uid) { return progress.progress(uid); }

    @GetMapping("/history")
    public HistoryDto history(@AuthenticationPrincipal Long uid) { return progress.history(uid); }

    @PostMapping("/adjust/lighten")
    public PlanDto lighten(@AuthenticationPrincipal Long uid) { return progress.lighten(uid); }

    @PostMapping("/adjust/grow")
    public PlanDto grow(@AuthenticationPrincipal Long uid) { return progress.grow(uid); }

    @PostMapping("/adjust/dismiss")
    public Message dismiss(@AuthenticationPrincipal Long uid, @RequestBody Map<String, String> body) {
        progress.dismiss(uid, body.get("type"));
        return new Message("Listo");
    }
}
