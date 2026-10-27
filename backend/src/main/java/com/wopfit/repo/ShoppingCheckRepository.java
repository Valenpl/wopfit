package com.wopfit.repo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.ShoppingCheck;

public interface ShoppingCheckRepository extends JpaRepository<ShoppingCheck, Long> {
    List<ShoppingCheck> findByUserIdAndWeek(Long userId, LocalDate week);
    Optional<ShoppingCheck> findByUserIdAndWeekAndItem(Long userId, LocalDate week, String item);
}
