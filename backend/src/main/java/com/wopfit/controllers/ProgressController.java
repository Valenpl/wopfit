package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.DismissRequest;
import com.wopfit.entity.dto.HistoryResponse;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.ProgressResponse;
import com.wopfit.service.ProgressService;

import jakarta.validation.Valid;

/** Progreso, historial y ajustes sugeridos del plan. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class ProgressController {
    private final ProgressService progress;

    @GetMapping("/progress")
    public ResponseEntity<ProgressResponse> progress(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(progress.progress(uid));
    }

    @GetMapping("/history")
    public ResponseEntity<HistoryResponse> history(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(progress.history(uid));
    }

    @PostMapping("/adjust/lighten")
    public ResponseEntity<PlanResponse> lighten(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(progress.lighten(uid));
    }

    @PostMapping("/adjust/grow")
    public ResponseEntity<PlanResponse> grow(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(progress.grow(uid));
    }

    @PostMapping("/adjust/dismiss")
    public ResponseEntity<MessageResponse> dismiss(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody DismissRequest r) {
        progress.dismiss(uid, r.type());
        return ResponseEntity.ok(new MessageResponse("Listo"));
    }
}
