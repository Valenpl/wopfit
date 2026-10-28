package com.wopfit.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.WopiMessage;

public interface WopiMessageRepository extends JpaRepository<WopiMessage, Long> {
    long countByUserIdAndMonthAndRole(Long userId, String month, String role);
    List<WopiMessage> findTop40ByUserIdOrderByIdDesc(Long userId);
    Optional<WopiMessage> findFirstByUserIdAndRoleOrderByIdDesc(Long userId, String role);
}
