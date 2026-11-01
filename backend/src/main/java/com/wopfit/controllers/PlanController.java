package com.wopfit.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PlanUpdateResponse;
import com.wopfit.service.PlanService;

/** Crear, actualizar y ver el plan. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/users/me/plan")
public class PlanController {
    private final PlanService plans;

    @PostMapping
    public ResponseEntity<PlanUpdateResponse> createPlan(@AuthenticationPrincipal(expression = "id") Long uid) {
        // La primera vez se crea el plan (201); después se actualiza con las preferencias nuevas (200).
        HttpStatus status = plans.hasPlan(uid) ? HttpStatus.OK : HttpStatus.CREATED;
        return ResponseEntity.status(status).body(plans.createOrUpdate(uid));
    }

    @GetMapping
    public ResponseEntity<PlanResponse> plan(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(plans.get(uid));
    }
}
