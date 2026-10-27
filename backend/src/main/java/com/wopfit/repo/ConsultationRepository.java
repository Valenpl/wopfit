package com.wopfit.repo;

import java.time.LocalDate;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Consultation;

public interface ConsultationRepository extends JpaRepository<Consultation, Long> {
    long countByUserIdAndBookedOnBetween(Long userId, LocalDate from, LocalDate to);
    List<Consultation> findByUserIdAndDateGreaterThanEqualOrderByDateAscTimeAsc(Long userId, LocalDate from);
    List<Consultation> findByProfessionalIdAndDateBetween(Long professionalId, LocalDate from, LocalDate to);
}
