package com.wopfit.controllers;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.MealAcceptRequest;
import com.wopfit.entity.dto.MealDayResponse;
import com.wopfit.entity.dto.MealProposalResponse;
import com.wopfit.entity.dto.MealReportRequest;
import com.wopfit.service.MealService;

import jakarta.validation.Valid;

/** Comidas del día: registrar, alternativa, saltear y cambiar. */
@RestController
@RequestMapping("/api/v1/meals")
public class MealController {
    private final MealService meals;

    public MealController(MealService meals) {
        this.meals = meals;
    }

    @GetMapping("/{date}")
    public ResponseEntity<MealDayResponse> mealDay(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(meals.day(uid, date));
    }

    @PostMapping("/{date}/{slot}/eaten")
    public ResponseEntity<MealDayResponse> eaten(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                            @PathVariable int slot) {
        return ResponseEntity.ok(meals.eaten(uid, date, slot));
    }

    @PostMapping("/{date}/{slot}/report")
    public ResponseEntity<MealProposalResponse> mealReport(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                      @PathVariable int slot, @Valid @RequestBody MealReportRequest r) {
        return ResponseEntity.ok(meals.report(uid, date, slot, r.reason()));
    }

    @PostMapping("/{date}/{slot}/accept")
    public ResponseEntity<MealDayResponse> mealAccept(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                                 @PathVariable int slot, @Valid @RequestBody MealAcceptRequest r) {
        return ResponseEntity.ok(meals.accept(uid, date, slot, r.name()));
    }

    @PostMapping("/{date}/{slot}/skip")
    public ResponseEntity<MealDayResponse> skip(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return ResponseEntity.ok(meals.skip(uid, date, slot));
    }

    @PostMapping("/{date}/{slot}/swap")
    public ResponseEntity<MealDayResponse> swap(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                           @PathVariable int slot) {
        return ResponseEntity.ok(meals.swap(uid, date, slot));
    }
}
