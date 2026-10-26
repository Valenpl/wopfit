package com.wopfit.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.Goal;
import com.wopfit.repo.GoalRepository;
import com.wopfit.web.dto.Dtos.GoalDto;
import com.wopfit.web.dto.Dtos.GoalRequest;

/** Metas chiquitas ("caminar 20 min, 3 veces por semana, 4 semanas") que suman a un objetivo. */
@Service
public class GoalService {
    private final GoalRepository goals;
    private final ProfileService profile;
    private final TimeService time;

    public GoalService(GoalRepository goals, ProfileService profile, TimeService time) {
        this.goals = goals;
        this.profile = profile;
        this.time = time;
    }

    public GoalDto dto(Goal g) {
        LocalDate today = time.today();
        int week = (int) Math.min(g.getWeeks(), ChronoUnit.WEEKS.between(TimeService.monday(g.getStartDate()), TimeService.monday(today)) + 1);
        LocalDate mon = TimeService.monday(today);
        int thisWeek = (int) g.getChecks().stream().filter(d -> !d.isBefore(mon) && !d.isAfter(mon.plusDays(6))).count();
        int target = g.getTimesPerWeek() * g.getWeeks();
        int pct = target == 0 ? 0 : Math.min(100, Math.round(100f * g.getChecks().size() / target));
        return new GoalDto(g.getId(), g.getObjective(), Catalog.GOALS.get(g.getObjective()), g.getWhat(), g.getTimesPerWeek(),
                g.getWeeks(), g.getStartDate(), Math.max(1, week), thisWeek, g.getChecks().contains(today), g.isDone(), g.getDoneAt(), pct);
    }

    @Transactional(readOnly = true)
    public List<GoalDto> list(Long userId) {
        return goals.findByUserIdOrderByStartDateDesc(userId).stream().map(this::dto).toList();
    }

    public List<Goal> entities(Long userId) {
        return goals.findByUserIdOrderByStartDateDesc(userId);
    }

    @Transactional
    public GoalDto create(Long userId, GoalRequest r) {
        if (!Catalog.GOALS.containsKey(r.objective())) throw ApiException.badRequest("Elegí un objetivo");
        long active = goals.findByUserIdOrderByStartDateDesc(userId).stream().filter(g -> !g.isDone()).count();
        if (active >= 5) throw ApiException.badRequest("Ya tenés 5 metas activas. Terminá alguna antes de sumar otra.");
        Goal g = new Goal();
        g.setUser(profile.user(userId));
        g.setObjective(r.objective());
        g.setWhat(r.what().trim());
        g.setTimesPerWeek(r.timesPerWeek());
        g.setWeeks(r.weeks());
        g.setStartDate(time.today());
        goals.save(g);
        return dto(g);
    }

    /** Marca (o desmarca) que hoy se cumplió la meta. Al llegar al total queda completada. */
    @Transactional
    public GoalDto check(Long userId, Long id) {
        Goal g = goals.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("No encontramos esa meta"));
        LocalDate today = time.today();
        if (g.isDone()) throw ApiException.badRequest("Esa meta ya está cumplida");
        if (g.getChecks().contains(today)) g.getChecks().remove(today);
        else g.getChecks().add(today);
        if (g.getChecks().size() >= g.getTimesPerWeek() * g.getWeeks()) {
            g.setDone(true);
            g.setDoneAt(today);
        }
        return dto(g);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Goal g = goals.findByIdAndUserId(id, userId).orElseThrow(() -> ApiException.notFound("No encontramos esa meta"));
        goals.delete(g);
    }
}
