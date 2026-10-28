package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Place;

public interface PlaceRepository extends JpaRepository<Place, Long> {
}
