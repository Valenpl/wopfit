package com.wopfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.CommunityProfile;

public interface CommunityProfileRepository extends JpaRepository<CommunityProfile, Long> {
    Optional<CommunityProfile> findByUserId(Long userId);
    boolean existsByDemoTrue();
}
