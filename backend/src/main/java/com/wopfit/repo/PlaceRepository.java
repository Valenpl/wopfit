package com.wopfit.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Place;

public interface PlaceRepository extends JpaRepository<Place, Long> {
}
