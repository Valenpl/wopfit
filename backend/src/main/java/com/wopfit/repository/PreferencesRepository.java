package com.wopfit.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Preferences;

public interface PreferencesRepository extends JpaRepository<Preferences, Long> {
    Optional<Preferences> findByUserId(Long userId);
    List<Preferences> findByUserIdIn(Collection<Long> userIds);
}
