package com.wopfit.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.MealLog;

public interface MealLogRepository extends JpaRepository<MealLog, Long> {
    Optional<MealLog> findByUserIdAndDateAndSlot(Long userId, LocalDate date, int slot);
    List<MealLog> findByUserIdAndDateBetween(Long userId, LocalDate from, LocalDate to);
    List<MealLog> findByUserIdAndReasonIsNotNullOrderByDateDesc(Long userId);
}
