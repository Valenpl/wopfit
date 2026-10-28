package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Photo;

public interface PhotoRepository extends JpaRepository<Photo, String> {
}
