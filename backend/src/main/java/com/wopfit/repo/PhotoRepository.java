package com.wopfit.repo;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.domain.Photo;

public interface PhotoRepository extends JpaRepository<Photo, String> {
}
