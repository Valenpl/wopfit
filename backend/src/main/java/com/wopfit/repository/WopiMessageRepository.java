package com.wopfit.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.WopiMessage;

public interface WopiMessageRepository extends JpaRepository<WopiMessage, Long> {
    long countByUserIdAndRoleAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(Long userId, String role, Instant from, Instant to);
    List<WopiMessage> findTop40ByUserIdOrderByIdDesc(Long userId);
    Optional<WopiMessage> findFirstByUserIdAndRoleOrderByIdDesc(Long userId, String role);
}
