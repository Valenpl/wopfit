package com.wopfit.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.SessionStatus;
import com.wopfit.entity.WorkoutSession;

public interface WorkoutSessionRepository extends JpaRepository<WorkoutSession, Long> {
    List<WorkoutSession> findByUserIdAndDateBetweenOrderByDateAsc(Long userId, LocalDate from, LocalDate to);
    List<WorkoutSession> findByUserIdAndDate(Long userId, LocalDate date);
    List<WorkoutSession> findByUserIdOrderByDateDesc(Long userId);
    List<WorkoutSession> findByUserIdAndStatusAndDateGreaterThanEqual(Long userId, SessionStatus status, LocalDate from);
    Optional<WorkoutSession> findByIdAndUserId(Long id, Long userId);
    boolean existsByUserIdAndDate(Long userId, LocalDate date);
}
