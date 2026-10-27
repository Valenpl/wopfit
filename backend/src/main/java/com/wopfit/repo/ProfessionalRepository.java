package com.wopfit.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Professional;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {
}
