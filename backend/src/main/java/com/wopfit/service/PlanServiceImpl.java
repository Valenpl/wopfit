package com.wopfit.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.Plan;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.SessionStatus;
import com.wopfit.entity.User;
import com.wopfit.entity.WorkoutSession;
import com.wopfit.entity.dto.Change;
import com.wopfit.entity.dto.DayResponse;
import com.wopfit.entity.dto.MoveResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PlanUpdateResponse;
import com.wopfit.entity.dto.ProposalResponse;
import com.wopfit.entity.dto.ReportResponse;
import com.wopfit.entity.dto.SessionResponse;
import com.wopfit.entity.dto.TodayResponse;
import com.wopfit.entity.dto.WeekResponse;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.exceptions.WorkoutNotFoundException;
import com.wopfit.repository.PlanRepository;
import com.wopfit.repository.WorkoutSessionRepository;

@RequiredArgsConstructor
@Service
public class PlanServiceImpl implements PlanService {
    private static final String[] DAY_NAMES = {"Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"};

    private final PlanRepository plans;
    private final WorkoutSessionRepository sessions;
    private final ProfileService profile;
    private final WorkoutCatalog workouts;
    private final TimeService time;

    @Override
    public Plan plan(Long userId) {
        return plans.findByUserId(userId).orElseThrow(() -> new InvalidDataException("Todavía no armaste tu plan"));
    }

    // ---------------- crear / actualizar ----------------

    @Transactional
    @Override
    public PlanUpdateResponse createOrUpdate(Long userId) {
        User u = profile.user(userId);
        Preferences p = profile.prefs(userId);
        LocalDate today = time.today();
        Plan plan = plans.findByUserId(userId).orElse(null);
        List<Change> changes = new ArrayList<>();
        if (plan == null) {
            plan = new Plan();
            plan.setUser(u);
            plan.setStartDate(today);
            plan.setLevel(p.getLevel());
        } else {
            changes = diff(plan, p);
            // Las sesiones pendientes desde hoy se regeneran con las preferencias nuevas.
            List<WorkoutSession> pend = sessions.findByUserIdAndStatusAndDateGreaterThanEqual(userId, SessionStatus.PENDING, today);
            sessions.deleteAll(pend);
            sessions.flush();
            if (!baseLevel(plan.getLevel()).equals(p.getLevel())) plan.setLevel(p.getLevel());
        }
        plan.setDays(new HashSet<>(p.getDays()));
        plan.setMinutes(p.getMinutes());
        plan.setGeneratedUntil(today.minusDays(1));
        plan.setUpdatedAt(Instant.now());
        p.getPendingChanges().clear();
        plans.save(plan);
        ensureSessions(plan, today.plusDays(13));
        return new PlanUpdateResponse(ProfileServiceImpl.planDto(plan, p), changes);
    }

    private static String baseLevel(String step) {
        return step == null ? "principiante" : step.replace("+", "");
    }

    private static String daysText(Set<Integer> d) {
        return d.stream().sorted().map(i -> DAY_NAMES[i]).collect(Collectors.joining(", "));
    }

    private List<Change> diff(Plan plan, Preferences p) {
        List<Change> c = new ArrayList<>();
        if (!plan.getDays().equals(p.getDays())) c.add(new Change("Días", daysText(plan.getDays()), daysText(p.getDays())));
        if (plan.getMinutes() != p.getMinutes()) c.add(new Change("Duración", plan.getMinutes() + " min", p.getMinutes() + " min"));
        if (!baseLevel(plan.getLevel()).equals(p.getLevel()))
            c.add(new Change("Nivel", Catalog.levelName(plan.getLevel()), Catalog.levelName(p.getLevel())));
        for (String label : p.getPendingChanges()) {
            if (label.equals("Tus días y tiempo") || label.equals("Tu nivel")) continue;
            c.add(new Change(label, "Antes", "Actualizado"));
        }
        return c;
    }

    @Transactional
    @Override
    public PlanResponse get(Long userId) {
        Plan plan = plan(userId);
        return ProfileServiceImpl.planDto(plan, profile.prefs(userId));
    }

    /** Crea las sesiones de los días del plan que faltan hasta {@code to}. */
    @Transactional
    @Override
    public void ensureSessions(Plan plan, LocalDate to) {
        LocalDate d = plan.getGeneratedUntil() == null ? plan.getStartDate() : plan.getGeneratedUntil().plusDays(1);
        if (d.isBefore(plan.getStartDate())) d = plan.getStartDate();
        Long userId = plan.getUser().getId();
        for (; !d.isAfter(to); d = d.plusDays(1)) {
            if (!plan.getDays().contains(TimeServiceImpl.dow(d))) continue;
            if (sessions.existsByUserIdAndDate(userId, d)) continue;
            WorkoutSession s = new WorkoutSession();
            s.setUser(plan.getUser());
            s.setDate(d);
            s.setStatus(SessionStatus.PENDING);
            s.setTemplate(templateFor(plan, d));
            sessions.save(s);
        }
        if (plan.getGeneratedUntil() == null || to.isAfter(plan.getGeneratedUntil())) plan.setGeneratedUntil(to);
    }

    private static int templateFor(Plan plan, LocalDate d) {
        long week = ChronoUnit.WEEKS.between(TimeServiceImpl.monday(plan.getStartDate()), TimeServiceImpl.monday(d));
        int pos = (int) plan.getDays().stream().filter(x -> x < TimeServiceImpl.dow(d)).count();
        return (int) ((week + pos) % 3);
    }

    // ---------------- lectura ----------------

    @Override
    public String status(WorkoutSession s) {
        if (s.getStatus() == SessionStatus.PENDING && s.getDate().isBefore(time.today())) return "MISSED";
        return s.getStatus().name();
    }

    @Override
    public SessionResponse dto(WorkoutSession s, Plan plan, Preferences p, boolean withContent) {
        WorkoutCatalog.Content content = null;
        String title = WorkoutCatalog.TEMPLATES[s.getTemplate() % 3][0];
        int minutes = plan.getMinutes();
        if (s.getAlternative() != null && s.getMovedFrom() != null) {
            WorkoutCatalog.Content alt = workouts.alternative(s.getAlternative(), s.getTemplate(), plan.getMinutes(), plan.getLevel(), p);
            title = alt.title();
            minutes = alt.minutes();
            if (withContent) content = alt;
        } else if (withContent) {
            content = workouts.session(s.getTemplate(), plan.getMinutes(), plan.getLevel(), p);
            title = content.title();
        }
        return new SessionResponse(s.getId(), s.getDate(), status(s), s.getTemplate(), title, minutes, s.getFeel(), s.getReason(),
                s.getReason() == null ? null : Catalog.WORKOUT_REASONS.get(s.getReason()), s.getMovedTo(), s.getMovedFrom(),
                s.getAlternative(), s.isAlternativeDone(), content);
    }

    @Transactional
    @Override
    public TodayResponse today(Long userId) {
        Plan plan = plan(userId);
        Preferences p = profile.prefs(userId);
        LocalDate today = time.today();
        ensureSessions(plan, today.plusDays(13));
        WorkoutSession s = sessions.findByUserIdAndDate(userId, today).stream().findFirst().orElse(null);
        List<SessionResponse> next = sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, today.plusDays(1), today.plusDays(13)).stream()
                .filter(x -> x.getStatus() == SessionStatus.PENDING).limit(3).map(x -> dto(x, plan, p, false)).toList();
        return new TodayResponse(today, s == null ? null : dto(s, plan, p, true), next,
                s == null ? workouts.alternative("walk", 0, plan.getMinutes(), plan.getLevel(), p) : null);
    }

    @Override
    public int weekNumber(Plan plan, LocalDate monday) {
        return (int) ChronoUnit.WEEKS.between(TimeServiceImpl.monday(plan.getStartDate()), monday) + 1;
    }

    @Transactional
    @Override
    public WeekResponse week(Long userId, LocalDate anyDay) {
        Plan plan = plan(userId);
        Preferences p = profile.prefs(userId);
        LocalDate today = time.today();
        LocalDate monday = TimeServiceImpl.monday(anyDay == null ? today : anyDay);
        LocalDate sunday = monday.plusDays(6);
        if (sunday.isAfter(plan.getGeneratedUntil())) ensureSessions(plan, sunday);
        List<WorkoutSession> list = sessions.findByUserIdAndDateBetweenOrderByDateAsc(userId, monday, sunday);
        List<DayResponse> days = new ArrayList<>();
        for (int i = 0; i < 7; i++) {
            LocalDate d = monday.plusDays(i);
            WorkoutSession s = list.stream().filter(x -> x.getDate().equals(d)).findFirst().orElse(null);
            days.add(new DayResponse(d, d.equals(today), s == null ? null : dto(s, plan, p, false)));
        }
        int done = (int) list.stream().filter(x -> x.getStatus() == SessionStatus.DONE || x.isAlternativeDone()).count();
        int total = (int) list.stream().filter(x -> x.getStatus() != SessionStatus.MOVED).count();
        return new WeekResponse(monday, weekNumber(plan, monday), done, Math.max(total, done), days);
    }

    @Transactional(readOnly = true)
    @Override
    public SessionResponse session(Long userId, Long id) {
        WorkoutSession s = owned(userId, id);
        return dto(s, plan(userId), profile.prefs(userId), true);
    }

    private WorkoutSession owned(Long userId, Long id) {
        return sessions.findByIdAndUserId(id, userId).orElseThrow(() -> new WorkoutNotFoundException());
    }

    // ---------------- "no pude" ----------------

    /** Primer día libre después de {@code d} (que no tenga sesión ni sea día del plan). */
    @Override
    public LocalDate nextFree(Plan plan, LocalDate d) {
        Long userId = plan.getUser().getId();
        for (int i = 1; i <= 14; i++) {
            LocalDate c = d.plusDays(i);
            if (!plan.getDays().contains(TimeServiceImpl.dow(c)) && !sessions.existsByUserIdAndDate(userId, c)) return c;
        }
        return d.plusDays(1);
    }

    @Transactional
    @Override
    public ReportResponse report(Long userId, Long id, String reason, String note) {
        if (!Catalog.WORKOUT_REASONS.containsKey(reason)) throw new InvalidDataException("Elegí un motivo");
        WorkoutSession s = owned(userId, id);
        if (s.getStatus() == SessionStatus.DONE) throw new InvalidDataException("Ese entrenamiento ya está hecho");
        Plan plan = plan(userId);
        Preferences p = profile.prefs(userId);
        LocalDate today = time.today();
        s.setReason(reason);
        s.setReasonNote(note);
        if (s.getStatus() == SessionStatus.PENDING && s.getDate().equals(today)) {
            String kind = WorkoutCatalog.alternativeFor(reason);
            WorkoutCatalog.Content alt = workouts.alternative(kind, s.getTemplate(), plan.getMinutes(), plan.getLevel(), p);
            return new ReportResponse("PROPOSAL", new ProposalResponse(WorkoutCatalog.proposalText(reason), kind, alt, nextFree(plan, today)),
                    null, null);
        }
        if (s.getStatus() == SessionStatus.PENDING && s.getDate().isBefore(today)) {
            LocalDate to = moveTo(plan, s, nextFree(plan, today.minusDays(1)), null);
            return new ReportResponse("MOVED", null, to, "Lo pasamos al " + fmt(to) + ". Sin culpa: seguimos.");
        }
        return new ReportResponse("NOTED", null, null, "Gracias por contarnos. Lo tenemos en cuenta para tu plan.");
    }

    static String fmt(LocalDate d) {
        String[] names = {"lunes", "martes", "miércoles", "jueves", "viernes", "sábado", "domingo"};
        return names[TimeServiceImpl.dow(d)] + " " + d.getDayOfMonth() + "/" + d.getMonthValue();
    }

    private LocalDate moveTo(Plan plan, WorkoutSession s, LocalDate to, String alternative) {
        s.setStatus(SessionStatus.MOVED);
        s.setMovedTo(to);
        s.setAlternative(alternative);
        WorkoutSession n = new WorkoutSession();
        n.setUser(s.getUser());
        n.setDate(to);
        n.setTemplate(s.getTemplate());
        n.setStatus(SessionStatus.PENDING);
        n.setMovedFrom(s.getDate());
        n.setAlternative(alternative);
        sessions.save(n);
        return to;
    }

    /** Acepta la versión alternativa: se hace hoy en lugar de la original, y la original pasa al próximo día libre. */
    @Transactional
    @Override
    public MoveResponse acceptAlternative(Long userId, Long id, String kind) {
        if (!WorkoutCatalog.ALTERNATIVES.contains(kind)) throw new InvalidDataException("Alternativa no válida");
        WorkoutSession s = owned(userId, id);
        if (s.getStatus() != SessionStatus.PENDING) throw new InvalidDataException("Ese entrenamiento ya no está pendiente");
        Plan plan = plan(userId);
        s.setAlternative(kind);
        s.setMovedFrom(s.getDate()); // marca que hoy se hace la versión alternativa
        LocalDate to = nextFree(plan, time.today());
        WorkoutSession n = new WorkoutSession();
        n.setUser(s.getUser());
        n.setDate(to);
        n.setTemplate(s.getTemplate());
        n.setStatus(SessionStatus.PENDING);
        sessions.save(n);
        s.setMovedTo(to);
        return new MoveResponse(dto(s, plan, profile.prefs(userId), true), to,
                "Hoy hacés la versión corta y la rutina completa queda para el " + fmt(to) + ".");
    }

    /** "Hoy descanso": la sesión pasa al próximo día libre. */
    @Transactional
    @Override
    public MoveResponse rest(Long userId, Long id) {
        WorkoutSession s = owned(userId, id);
        if (s.getStatus() != SessionStatus.PENDING) throw new InvalidDataException("Ese entrenamiento ya no está pendiente");
        Plan plan = plan(userId);
        LocalDate base = s.getDate().isBefore(time.today()) ? time.today().minusDays(1) : s.getDate();
        LocalDate to = moveTo(plan, s, nextFree(plan, base), null);
        return new MoveResponse(dto(s, plan, profile.prefs(userId), false), to,
                "Descansar también es parte del plan. Lo pasamos al " + fmt(to) + ".");
    }

    /** Reprograma una sesión que se perdió. */
    @Transactional
    @Override
    public MoveResponse reschedule(Long userId, Long id) {
        return rest(userId, id);
    }

    @Transactional
    @Override
    public SessionResponse done(Long userId, Long id, Integer feel, String note) {
        WorkoutSession s = owned(userId, id);
        if (s.getDate().isAfter(time.today())) throw new InvalidDataException("Todavía no llegó ese día");
        if (s.getStatus() == SessionStatus.MOVED) throw new InvalidDataException("Ese entrenamiento se pasó a otro día");
        s.setStatus(SessionStatus.DONE);
        if (s.getAlternative() != null) s.setAlternativeDone(true);
        s.setFeel(feel);
        s.setNote(note);
        return dto(s, plan(userId), profile.prefs(userId), false);
    }
}
