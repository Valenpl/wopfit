package com.wopfit.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Plan;

public interface PlanRepository extends JpaRepository<Plan, Long> {
    Optional<Plan> findByUserId(Long userId);
}
