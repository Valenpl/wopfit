package com.wopfit.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.CommunityProfile;

public interface CommunityProfileRepository extends JpaRepository<CommunityProfile, Long> {
    Optional<CommunityProfile> findByUserId(Long userId);
    boolean existsByDemoTrue();
}
