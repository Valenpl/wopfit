package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.PlanUpdateResponse;
import com.wopfit.service.PlanService;

/** Crear, actualizar y ver el plan. */
@RestController
@RequestMapping("/api/v1/plan")
public class PlanController {
    private final PlanService plans;

    public PlanController(PlanService plans) {
        this.plans = plans;
    }

    @PostMapping
    public ResponseEntity<PlanUpdateResponse> createPlan(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(plans.createOrUpdate(uid));
    }

    @GetMapping
    public ResponseEntity<PlanResponse> plan(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(plans.get(uid));
    }
}
