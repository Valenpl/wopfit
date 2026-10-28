package com.wopfit.controllers;

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

import com.wopfit.entity.dto.AboutRequest;
import com.wopfit.entity.dto.AlternativeRequest;
import com.wopfit.entity.dto.DoneRequest;
import com.wopfit.entity.dto.GoalRequest;
import com.wopfit.entity.dto.GoalResponse;
import com.wopfit.entity.dto.HabitsResponse;
import com.wopfit.entity.dto.HistoryResponse;
import com.wopfit.entity.dto.MeResponse;
import com.wopfit.entity.dto.MealDayResponse;
import com.wopfit.entity.dto.MealProposalResponse;
import com.wopfit.entity.dto.MealReportRequest;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.entity.dto.MoveResponse;
import com.wopfit.entity.dto.OffersResponse;
import com.wopfit.entity.dto.PasswordRequest;
import com.wopfit.entity.dto.PlaceResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PlanUpdateResponse;
import com.wopfit.entity.dto.PreferencesRequest;
import com.wopfit.entity.dto.ProgressResponse;
import com.wopfit.entity.dto.ReportRequest;
import com.wopfit.entity.dto.ReportResponse;
import com.wopfit.entity.dto.SessionResponse;
import com.wopfit.entity.dto.ShoppingCheckRequest;
import com.wopfit.entity.dto.ShoppingResponse;
import com.wopfit.entity.dto.SubscriptionRequest;
import com.wopfit.entity.dto.TodayResponse;
import com.wopfit.entity.dto.WeekResponse;
import com.wopfit.service.AuthService;
import com.wopfit.service.Catalog;
import com.wopfit.service.GoalService;
import com.wopfit.service.HabitService;
import com.wopfit.service.MealService;
import com.wopfit.service.PlaceService;
import com.wopfit.service.PlanService;
import com.wopfit.service.PremiumService;
import com.wopfit.service.ProfileService;
import com.wopfit.service.ProgressService;

import jakarta.validation.Valid;

/** Todo lo que necesita una sesión iniciada. El usuario sale del token (principal = id). */
@RestController
@RequestMapping("/api")
public class MeController {
    private final ProfileService profile;
    private final AuthService auth;
    private final PremiumService premium;
    private final PlaceService placeService;
    private final PlanService plans;
    private final MealService meals;
    private final HabitService habits;
    private final GoalService goals;
    private final ProgressService progress;

    public MeController(ProfileService profile, AuthService auth, PremiumService premium, PlaceService placeService, PlanService plans, MealService meals, HabitService habits, GoalService goals,
                        ProgressService progress) {
        this.profile = profile;
        this.auth = auth;
        this.premium = premium;
        this.placeService = placeService;
        this.plans = plans;
        this.meals = meals;
        this.habits = habits;
        this.goals = goals;
        this.progress = progress;
    }

    // ---- catálogo (opciones para los formularios) ----
    @GetMapping("/catalog")
    public Map<String, Object> catalog() {
        return Map.ofEntries(Map.entry("goals", Catalog.GOALS), Map.entry("activities", Catalog.ACTIVITIES), Map.entry("avoid", Catalog.AVOID),
                Map.entry("health", Catalog.HEALTH), Map.entry("equipment", Catalog.EQUIPMENT), Map.entry("levels", Catalog.LEVELS),
                Map.entry("budgets", Catalog.BUDGETS), Map.entry("workoutReasons", Catalog.WORKOUT_REASONS),
                Map.entry("mealReasons", Catalog.MEAL_REASONS), Map.entry("goalOptions", Catalog.GOAL_OPTIONS),
                Map.entry("premiumPeriods", Catalog.PREMIUM_PERIODS), Map.entry("placeCategories", Catalog.PLACE_CATEGORIES),
                Map.entry("offerCategories", Catalog.OFFER_CATEGORIES));
    }

    // ---- perfil ----
    @GetMapping("/me")
    public MeResponse me(@AuthenticationPrincipal Long uid) { return profile.me(uid); }

    @PutMapping("/me/about")
    public MeResponse about(@AuthenticationPrincipal Long uid, @Valid @RequestBody AboutRequest r) { return profile.updateAbout(uid, r); }

    @PutMapping("/me/preferences")
    public MeResponse preferences(@AuthenticationPrincipal Long uid, @Valid @RequestBody PreferencesRequest r) {
        return profile.updatePreferences(uid, r);
    }

    @PutMapping("/me/password")
    public MessageResponse password(@AuthenticationPrincipal Long uid, @Valid @RequestBody PasswordRequest r) {
        auth.changePassword(uid, r.current(), r.password());
        return new MessageResponse("Contraseña actualizada");
    }

    // ---- Premium de demostración (sin cobros) ----
    @PostMapping("/subscription")
    public MeResponse subscribe(@AuthenticationPrincipal Long uid, @Valid @RequestBody SubscriptionRequest r) {
        premium.activate(uid, r.period());
        return profile.me(uid);
    }

    @DeleteMapping("/subscription")
    public MeResponse unsubscribe(@AuthenticationPrincipal Long uid) {
        premium.cancel(uid);
        return profile.me(uid);
    }

    // ---- plan ----
    @PostMapping("/plan")
    public PlanUpdateResponse createPlan(@AuthenticationPrincipal Long uid) { return plans.createOrUpdate(uid); }

    @GetMapping("/plan")
    public PlanResponse plan(@AuthenticationPrincipal Long uid) { return plans.get(uid); }

    // ---- entrenamientos ----
    @GetMapping("/workouts/today")
    public TodayResponse today(@AuthenticationPrincipal Long uid) { return plans.today(uid); }

    @GetMapping("/workouts/week")
    public WeekResponse week(@AuthenticationPrincipal Long uid,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return plans.week(uid, start);
    }

    @GetMapping("/workouts/{id}")
    public SessionResponse session(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return plans.session(uid, id); }

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
    public SessionResponse done(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody(required = false) DoneRequest r) {
        return plans.done(uid, id, r == null ? null : r.feel(), r == null ? null : r.note());
    }

    // ---- comidas ----
    @GetMapping("/meals/{date}")
    public MealDayResponse mealDay(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return meals.day(uid, date);
    }

    @PostMapping("/meals/{date}/{slot}/eaten")
    public MealDayResponse eaten(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                            @PathVariable int slot) {
        return meals.eaten(uid, date, slot);
    }

    @PostMapping("/meals/{date}/{slot}/report")
    public MealProposalResponse mealReport(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @PathVariable int slot, @Valid @RequestBody MealReportRequest r) {
        return meals.report(uid, date, slot, r.reason());
    }

    @PostMapping("/meals/{date}/{slot}/accept")
    public MealDayResponse mealAccept(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                 @PathVariable int slot, @RequestBody Map<String, String> body) {
        return meals.accept(uid, date, slot, body.getOrDefault("name", ""));
    }

    @PostMapping("/meals/{date}/{slot}/skip")
    public MealDayResponse skip(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return meals.skip(uid, date, slot);
    }

    @PostMapping("/meals/{date}/{slot}/swap")
    public MealDayResponse swap(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return meals.swap(uid, date, slot);
    }

    // ---- lista del súper (semana de la fecha) ----
    @GetMapping("/shopping/{date}")
    public ShoppingResponse shopping(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return meals.shopping(uid, date);
    }

    @PutMapping("/shopping/{date}")
    public ShoppingResponse check(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                             @Valid @RequestBody ShoppingCheckRequest r) {
        return meals.check(uid, date, r.name(), r.checked());
    }

    // ---- lugares cercanos (Premium) y ofertas, de demostración ----
    @GetMapping("/places")
    public List<PlaceResponse> places(@AuthenticationPrincipal Long uid) { return placeService.places(uid); }

    @GetMapping("/offers")
    public OffersResponse offers(@AuthenticationPrincipal Long uid) { return placeService.offers(uid); }

    // ---- hábitos ----
    @GetMapping("/habits/{date}")
    public HabitsResponse habits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return habits.get(uid, date);
    }

    @PutMapping("/habits/{date}")
    public HabitsResponse setHabits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                               @RequestBody HabitsResponse body) {
        return habits.set(uid, date, body);
    }

    // ---- metas ----
    @GetMapping("/goals")
    public List<GoalResponse> goals(@AuthenticationPrincipal Long uid) { return goals.list(uid); }

    @PostMapping("/goals")
    @ResponseStatus(HttpStatus.CREATED)
    public GoalResponse createGoal(@AuthenticationPrincipal Long uid, @Valid @RequestBody GoalRequest r) { return goals.create(uid, r); }

    @PostMapping("/goals/{id}/check")
    public GoalResponse check(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return goals.check(uid, id); }

    @DeleteMapping("/goals/{id}")
    public MessageResponse deleteGoal(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        goals.delete(uid, id);
        return new MessageResponse("Meta eliminada");
    }

    // ---- progreso ----
    @GetMapping("/progress")
    public ProgressResponse progress(@AuthenticationPrincipal Long uid) { return progress.progress(uid); }

    @GetMapping("/history")
    public HistoryResponse history(@AuthenticationPrincipal Long uid) { return progress.history(uid); }

    @PostMapping("/adjust/lighten")
    public PlanResponse lighten(@AuthenticationPrincipal Long uid) { return progress.lighten(uid); }

    @PostMapping("/adjust/grow")
    public PlanResponse grow(@AuthenticationPrincipal Long uid) { return progress.grow(uid); }

    @PostMapping("/adjust/dismiss")
    public MessageResponse dismiss(@AuthenticationPrincipal Long uid, @RequestBody Map<String, String> body) {
        progress.dismiss(uid, body.get("type"));
        return new MessageResponse("Listo");
    }
}
