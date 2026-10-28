package com.wopfit.service;

import java.time.LocalDate;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.entity.HabitLog;
import com.wopfit.entity.dto.HabitsRequest;
import com.wopfit.entity.dto.HabitsResponse;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.repository.HabitLogRepository;

@Service
public class HabitServiceImpl implements HabitService {
    private final HabitLogRepository habits;
    private final ProfileService profile;
    private final TimeService time;

    public HabitServiceImpl(HabitLogRepository habits, ProfileService profile, TimeService time) {
        this.habits = habits;
        this.profile = profile;
        this.time = time;
    }

    public static HabitsResponse dto(HabitLog h, LocalDate d) {
        return h == null ? new HabitsResponse(d, false, false, false) : new HabitsResponse(h.getDate(), h.isWater(), h.isWalk(), h.isSleep());
    }

    @Transactional(readOnly = true)
    @Override
    public HabitsResponse get(Long userId, LocalDate date) {
        return dto(habits.findByUserIdAndDate(userId, date).orElse(null), date);
    }

    @Transactional
    @Override
    public HabitsResponse set(Long userId, LocalDate date, HabitsRequest in) {
        if (date.isAfter(time.today())) throw new InvalidDataException("No podés registrar días que todavía no pasaron");
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
