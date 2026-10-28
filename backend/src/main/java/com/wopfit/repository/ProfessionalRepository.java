package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Professional;

public interface ProfessionalRepository extends JpaRepository<Professional, Long> {
}
