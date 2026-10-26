package com.wopfit.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.domain.HabitLog;
import com.wopfit.repo.HabitLogRepository;
import com.wopfit.web.dto.Dtos.HabitsDto;

@Service
public class HabitService {
    private final HabitLogRepository habits;
    private final ProfileService profile;
    private final TimeService time;

    public HabitService(HabitLogRepository habits, ProfileService profile, TimeService time) {
        this.habits = habits;
        this.profile = profile;
        this.time = time;
    }

    public static HabitsDto dto(HabitLog h, LocalDate d) {
        return h == null ? new HabitsDto(d, false, false, false) : new HabitsDto(h.getDate(), h.isWater(), h.isWalk(), h.isSleep());
    }

    @Transactional(readOnly = true)
    public HabitsDto get(Long userId, LocalDate date) {
        return dto(habits.findByUserIdAndDate(userId, date).orElse(null), date);
    }

    @Transactional
    public HabitsDto set(Long userId, LocalDate date, HabitsDto in) {
        if (date.isAfter(time.today())) throw ApiException.badRequest("No podés registrar días que todavía no pasaron");
        HabitLog h = habits.findByUserIdAndDate(userId, date).orElseGet(() -> {
            HabitLog n = new HabitLog();
            n.setUser(profile.user(userId));
            n.setDate(date);
            return n;
        });
        h.setWater(in.water());
        h.setWalk(in.walk());
        h.setSleep(in.sleep());
        habits.save(h);
        return dto(h, date);
    }
}
