package com.wopfit.service;

import java.time.LocalDate;

import com.wopfit.entity.Plan;
import com.wopfit.entity.Preferences;
import com.wopfit.entity.WorkoutSession;
import com.wopfit.entity.dto.MoveResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PlanUpdateResponse;
import com.wopfit.entity.dto.ReportResponse;
import com.wopfit.entity.dto.SessionResponse;
import com.wopfit.entity.dto.TodayResponse;
import com.wopfit.entity.dto.WeekResponse;

/** Plan de entrenamiento: genera las sesiones, las reporta, las mueve y ofrece alternativas. */
public interface PlanService {
    Plan plan(Long userId);
    PlanUpdateResponse createOrUpdate(Long userId);
    PlanResponse get(Long userId);
    /** Si la persona ya tiene un plan (para saber si POST /plan crea o actualiza). */
    boolean hasPlan(Long userId);
    void ensureSessions(Plan plan, LocalDate to);
    String status(WorkoutSession s);
    SessionResponse dto(WorkoutSession s, Plan plan, Preferences p, boolean withContent);
    TodayResponse today(Long userId);
    int weekNumber(Plan plan, LocalDate monday);
    WeekResponse week(Long userId, LocalDate anyDay);
    SessionResponse session(Long userId, Long id);
    LocalDate nextFree(Plan plan, LocalDate d);
    ReportResponse report(Long userId, Long id, String reason, String note);
    MoveResponse acceptAlternative(Long userId, Long id, String kind);
    MoveResponse rest(Long userId, Long id);
    MoveResponse reschedule(Long userId, Long id);
    SessionResponse done(Long userId, Long id, Integer feel, String note);
}
