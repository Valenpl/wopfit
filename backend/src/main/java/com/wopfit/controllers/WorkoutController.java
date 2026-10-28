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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.AlternativeRequest;
import com.wopfit.entity.dto.DoneRequest;
import com.wopfit.entity.dto.MoveResponse;
import com.wopfit.entity.dto.ReportRequest;
import com.wopfit.entity.dto.ReportResponse;
import com.wopfit.entity.dto.SessionResponse;
import com.wopfit.entity.dto.TodayResponse;
import com.wopfit.entity.dto.WeekResponse;
import com.wopfit.service.PlanService;

import jakarta.validation.Valid;

/** Entrenamientos del plan: hoy, semana, "no pude", mover y completar. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/workouts")
public class WorkoutController {
    private final PlanService plans;

    @GetMapping("/today")
    public ResponseEntity<TodayResponse> today(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(plans.today(uid));
    }

    @GetMapping("/week")
    public ResponseEntity<WeekResponse> week(@AuthenticationPrincipal(expression = "id") Long uid,
                        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start) {
        return ResponseEntity.ok(plans.week(uid, start));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SessionResponse> session(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(plans.session(uid, id));
    }

    @PostMapping("/{id}/report")
    public ResponseEntity<ReportResponse> report(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody ReportRequest r) {
        return ResponseEntity.ok(plans.report(uid, id, r.reason(), r.note()));
    }

    @PostMapping("/{id}/accept-alternative")
    public ResponseEntity<MoveResponse> accept(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody AlternativeRequest r) {
        return ResponseEntity.ok(plans.acceptAlternative(uid, id, r.kind()));
    }

    @PostMapping("/{id}/rest")
    public ResponseEntity<MoveResponse> rest(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(plans.rest(uid, id));
    }

    @PostMapping("/{id}/reschedule")
    public ResponseEntity<MoveResponse> reschedule(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(plans.reschedule(uid, id));
    }

    @PostMapping("/{id}/done")
    public ResponseEntity<SessionResponse> done(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody(required = false) DoneRequest r) {
        return ResponseEntity.ok(plans.done(uid, id, r == null ? null : r.feel(), r == null ? null : r.note()));
    }
}
