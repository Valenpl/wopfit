package com.wopfit.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.wopfit.entity.Brand;

public interface BrandRepository extends JpaRepository<Brand, Long> {
}
