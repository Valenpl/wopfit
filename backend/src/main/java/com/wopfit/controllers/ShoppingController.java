package com.wopfit.controllers;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.ShoppingCheckRequest;
import com.wopfit.entity.dto.ShoppingResponse;
import com.wopfit.service.MealService;

import jakarta.validation.Valid;

/** Lista del súper de la semana de la fecha. */
@RestController
@RequestMapping("/api/v1/shopping")
public class ShoppingController {
    private final MealService meals;

    public ShoppingController(MealService meals) {
        this.meals = meals;
    }

    @GetMapping("/{date}")
    public ResponseEntity<ShoppingResponse> shopping(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(meals.shopping(uid, date));
    }

    @PutMapping("/{date}")
    public ResponseEntity<ShoppingResponse> check(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                             @Valid @RequestBody ShoppingCheckRequest r) {
        return ResponseEntity.ok(meals.check(uid, date, r.name(), r.checked()));
    }
}
