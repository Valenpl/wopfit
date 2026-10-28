package com.wopfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Plan;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByUserId(Long userId);
}
