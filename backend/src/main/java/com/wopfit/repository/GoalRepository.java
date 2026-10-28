package com.wopfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Goal;

public interface GoalRepository extends JpaRepository<Goal, Long> {
    List<Goal> findByUserIdOrderByStartDateDesc(Long userId);
    Optional<Goal> findByIdAndUserId(Long id, Long userId);
}
