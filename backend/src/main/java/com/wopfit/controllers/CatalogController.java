package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.CatalogResponse;
import com.wopfit.service.CatalogService;

/** Opciones para armar los formularios (objetivos, actividades, motivos...). */
@RestController
@RequestMapping("/api/v1/catalog")
public class CatalogController {
    private final CatalogService catalog;

    public CatalogController(CatalogService catalog) {
        this.catalog = catalog;
    }

    @GetMapping
    public ResponseEntity<CatalogResponse> catalog() { return ResponseEntity.ok(catalog.catalog()); }
}
