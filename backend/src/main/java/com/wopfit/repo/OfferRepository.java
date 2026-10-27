package com.wopfit.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Offer;

public interface OfferRepository extends JpaRepository<Offer, Long> {
}
