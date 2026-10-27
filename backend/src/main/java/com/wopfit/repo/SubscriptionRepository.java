package com.wopfit.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);
}
