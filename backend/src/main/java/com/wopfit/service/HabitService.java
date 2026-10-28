package com.wopfit.service;

import java.time.LocalDate;

import com.wopfit.entity.dto.HabitsRequest;
import com.wopfit.entity.dto.HabitsResponse;

public interface HabitService {
    HabitsResponse get(Long userId, LocalDate date);
    HabitsResponse set(Long userId, LocalDate date, HabitsRequest in);
}
