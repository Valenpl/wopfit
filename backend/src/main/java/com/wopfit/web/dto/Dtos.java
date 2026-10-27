package com.wopfit.web.dto;

import java.time.LocalDate;
import java.util.List;
import java.util.Set;

import com.wopfit.service.WorkoutCatalog;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Objetos que entran y salen de la API. */
public final class Dtos {
    private Dtos() {}

    // ---------- auth ----------
    public record RegisterRequest(
            @NotBlank(message = "Escribí tu email") @Email(message = "Revisá el formato del email") String email,
            @NotBlank @Size(min = 8, message = "Mínimo 8 caracteres") @Pattern(regexp = ".*\\d.*", message = "Tiene que tener al menos un número") String password) {}
    public record RegisterResponse(String message, String devCode) {}
    public record VerifyRequest(@NotBlank @Email String email,
            @NotBlank @Pattern(regexp = "\\d{6}", message = "El código tiene 6 números") String code) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record AuthResponse(String token, Me me) {}
    public record PasswordRequest(@NotBlank(message = "Escribí tu contraseña actual") String current,
            @NotBlank @Size(min = 8, message = "Mínimo 8 caracteres") @Pattern(regexp = ".*\\d.*", message = "Tiene que tener al menos un número") String password) {}

    // ---------- perfil ----------
    public record AboutRequest(
            @NotBlank(message = "Contanos cómo te llamamos") @Size(max = 80) String name,
            @NotNull(message = "Completá tu fecha de nacimiento") @Past LocalDate birthDate,
            @Min(value = 100, message = "La altura va en centímetros") @Max(230) Integer heightCm,
            @DecimalMin(value = "30", message = "El peso va en kilos") @DecimalMax("300") Double weightKg) {}

    public record PreferencesRequest(
            @NotEmpty(message = "Elegí al menos un objetivo") Set<String> goals,
            @NotEmpty(message = "Elegí al menos un día") Set<@Min(0) @Max(6) Integer> days,
            @Min(10) @Max(90) int minutes,
            @NotBlank String budget,
            Set<String> activities,
            Set<String> avoid,
            @Size(max = 80) String otherAvoid,
            Set<String> health,
            @NotBlank String level,
            Set<String> equipment) {}

    public record PreferencesDto(Set<String> goals, List<Integer> days, int minutes, String budget, Set<String> activities,
            Set<String> avoid, String otherAvoid, Set<String> health, String level, Set<String> equipment, Set<String> pendingChanges) {}

    public record PlanDto(LocalDate startDate, List<Integer> days, int minutes, String level, String levelName,
            String trainingSummary, String foodSummary, List<String> healthNotes) {}

    public record Me(Long id, String email, String name, LocalDate birthDate, Integer heightCm, Double weightKg,
            boolean verified, PreferencesDto preferences, PlanDto plan, SubscriptionDto subscription) {}

    /** `demo` siempre es true: Premium se activa sin pagar. */
    public record SubscriptionDto(boolean premium, String period, String periodName, LocalDate until, boolean demo) {}
    public record SubscriptionRequest(@NotBlank(message = "Elegí cada cuánto") String period) {}

    public record Change(String label, String before, String after) {}
    public record PlanUpdateResponse(PlanDto plan, List<Change> changes) {}

    // ---------- entrenamiento ----------
    public record SessionDto(Long id, LocalDate date, String status, int template, String title, int minutes,
            Integer feel, String reason, String reasonLabel, LocalDate movedTo, LocalDate movedFrom,
            String alternative, boolean alternativeDone, WorkoutCatalog.Content content) {}
    public record DayDto(LocalDate date, boolean today, SessionDto session) {}
    public record WeekDto(LocalDate monday, int weekNumber, int done, int total, List<DayDto> days) {}
    public record TodayDto(LocalDate date, SessionDto session, List<SessionDto> next, WorkoutCatalog.Content alternativeToday) {}

    public record ReportRequest(@NotBlank(message = "Contanos qué pasó") String reason, @Size(max = 300) String note) {}
    public record ProposalDto(String text, String kind, WorkoutCatalog.Content alternative, LocalDate nextDate) {}
    public record ReportResponse(String action, ProposalDto proposal, LocalDate movedTo, String message) {}
    public record DoneRequest(@Min(0) @Max(4) Integer feel, @Size(max = 300) String note) {}
    public record AlternativeRequest(@NotBlank String kind) {}
    public record MoveResponse(SessionDto session, LocalDate movedTo, String message) {}

    // ---------- comida ----------
    public record MealDto(int slot, String slotName, String time, String name, String ingredients, int price, String emoji,
            List<String> steps, List<String> tags, String status, String reason) {}
    public record MealDayDto(LocalDate date, List<MealDto> meals, int weekCost, int budgetMax) {}
    public record MealReportRequest(@NotBlank String reason) {}
    public record MealProposalDto(String text, MealDto current, MealDto alternative) {}
    public record ShoppingItem(String name, int count, boolean checked, boolean offer) {}
    public record ShoppingDto(LocalDate monday, int weekCost, int budgetMax, List<ShoppingItem> items) {}
    public record ShoppingCheckRequest(@NotBlank String name, boolean checked) {}

    // ---------- lugares y ofertas (datos de demostración) ----------
    public record PlaceDto(Long id, String name, String brand, String category, String categoryName, String address, String barrio,
            double lat, double lng, boolean openNow, String status, boolean discount, int offers) {}
    public record Branch(Long id, String address, String barrio, double lat, double lng) {}
    public record OfferDto(Long id, String code, String store, String category, String categoryName, String off, String unit,
            String description, int daysLeft, List<String> ingredients, boolean forList, List<Branch> branches) {}
    /** `alerts`: con Premium se avisa cuando hay ofertas para tu lista. */
    public record OffersDto(boolean alerts, List<OfferDto> offers) {}

    // ---------- hábitos y metas ----------
    public record HabitsDto(LocalDate date, boolean water, boolean walk, boolean sleep) {}
    public record GoalRequest(@NotBlank String objective, @NotBlank @Size(max = 120) String what,
            @Min(1) @Max(7) int timesPerWeek, @Min(1) @Max(12) int weeks) {}
    public record GoalDto(Long id, String objective, String objectiveName, String what, int timesPerWeek, int weeks,
            LocalDate startDate, int currentWeek, int doneThisWeek, boolean checkedToday, boolean done, LocalDate doneAt,
            int objectivePercent) {}

    // ---------- progreso ----------
    public record ObjectiveProgress(String code, String name, int percent, String detail) {}
    public record Struggle(LocalDate date, String reason, String reasonLabel) {}
    public record Suggestion(String type, String text, String field, String from, String to, List<Struggle> struggles) {}
    public record ProgressDto(int weekNumber, int sessionsDone, int sessionsTotal, int habitsToday, int weeksStreak,
            List<ObjectiveProgress> objectives, Suggestion suggestion, List<DayDto> week) {}
    public record Difficulty(LocalDate date, String kind, String label, String note) {}
    public record HistoryWeek(LocalDate monday, int weekNumber, int done, int total, List<SessionDto> sessions, List<HabitsDto> habits) {}
    public record HistoryDto(List<HistoryWeek> weeks, List<Difficulty> difficulties, String mostCommon, int mostCommonCount) {}

    public record Message(String message) {}
}
