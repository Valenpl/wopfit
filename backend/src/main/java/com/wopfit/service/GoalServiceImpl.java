package com.wopfit.service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.Goal;
import com.wopfit.entity.dto.GoalRequest;
import com.wopfit.entity.dto.GoalResponse;
import com.wopfit.exceptions.GoalNotFoundException;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.repository.GoalRepository;

@RequiredArgsConstructor
@Service
public class GoalServiceImpl implements GoalService {
    private final GoalRepository goals;
    private final ProfileService profile;
    private final TimeService time;

    @Override
    public GoalResponse dto(Goal g) {
        LocalDate today = time.today();
        int week = (int) Math.min(g.getWeeks(), ChronoUnit.WEEKS.between(TimeServiceImpl.monday(g.getStartDate()), TimeServiceImpl.monday(today)) + 1);
        LocalDate mon = TimeServiceImpl.monday(today);
        int thisWeek = (int) g.getChecks().stream().filter(d -> !d.isBefore(mon) && !d.isAfter(mon.plusDays(6))).count();
        int target = g.getTimesPerWeek() * g.getWeeks();
        int pct = target == 0 ? 0 : Math.min(100, Math.round(100f * g.getChecks().size() / target));
        return new GoalResponse(g.getId(), g.getObjective(), Catalog.GOALS.get(g.getObjective()), g.getWhat(), g.getTimesPerWeek(),
                g.getWeeks(), g.getStartDate(), Math.max(1, week), thisWeek, g.getChecks().contains(today), g.isDone(), g.getDoneAt(), pct);
    }

    @Transactional(readOnly = true)
    @Override
    public List<GoalResponse> list(Long userId) {
        return goals.findByUserIdOrderByStartDateDesc(userId).stream().map(this::dto).toList();
    }

    @Override
    public List<Goal> entities(Long userId) {
        return goals.findByUserIdOrderByStartDateDesc(userId);
    }

    @Transactional
    @Override
    public GoalResponse create(Long userId, GoalRequest r) {
        if (!Catalog.GOALS.containsKey(r.objective())) throw new InvalidDataException("Elegí un objetivo");
        long active = goals.findByUserIdOrderByStartDateDesc(userId).stream().filter(g -> !g.isDone()).count();
        if (active >= 5) throw new InvalidDataException("Ya tenés 5 metas activas. Terminá alguna antes de sumar otra.");
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
    @Override
    public GoalResponse check(Long userId, Long id) {
        Goal g = goals.findByIdAndUserId(id, userId).orElseThrow(() -> new GoalNotFoundException());
        LocalDate today = time.today();
        if (g.isDone()) throw new InvalidDataException("Esa meta ya está cumplida");
        if (g.getChecks().contains(today)) g.getChecks().remove(today);
        else g.getChecks().add(today);
        if (g.getChecks().size() >= g.getTimesPerWeek() * g.getWeeks()) {
            g.setDone(true);
            g.setDoneAt(today);
        }
        return dto(g);
    }

    @Transactional
    @Override
    public void delete(Long userId, Long id) {
        Goal g = goals.findByIdAndUserId(id, userId).orElseThrow(() -> new GoalNotFoundException());
        goals.delete(g);
    }
}
