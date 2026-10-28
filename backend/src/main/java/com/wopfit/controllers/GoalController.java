package com.wopfit.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.GoalRequest;
import com.wopfit.entity.dto.GoalResponse;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.service.GoalService;

import jakarta.validation.Valid;

/** Metas chicas que suman a un objetivo. */
@RestController
@RequestMapping("/api/v1/goals")
public class GoalController {
    private final GoalService goals;

    public GoalController(GoalService goals) {
        this.goals = goals;
    }

    @GetMapping
    public ResponseEntity<List<GoalResponse>> goals(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(goals.list(uid));
    }

    @PostMapping
    public ResponseEntity<GoalResponse> createGoal(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody GoalRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(goals.create(uid, r));
    }

    @PostMapping("/{id}/check")
    public ResponseEntity<GoalResponse> check(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(goals.check(uid, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteGoal(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        goals.delete(uid, id);
        return ResponseEntity.ok(new MessageResponse("Meta eliminada"));
    }
}
