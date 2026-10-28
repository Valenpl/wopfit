package com.wopfit.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Subscription;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {
    Optional<Subscription> findByUserId(Long userId);
}
