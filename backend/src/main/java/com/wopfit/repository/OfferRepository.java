package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Offer;

public interface OfferRepository extends JpaRepository<Offer, Long> {
}
