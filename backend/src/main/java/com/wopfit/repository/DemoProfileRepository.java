package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.DemoProfile;

public interface DemoProfileRepository extends JpaRepository<DemoProfile, Long> {
}
