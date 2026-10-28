package com.wopfit.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.WopiAskRequest;
import com.wopfit.entity.dto.WopiAskResponse;
import com.wopfit.entity.dto.WopiResponse;
import com.wopfit.service.WopiService;

import jakarta.validation.Valid;

/** Chat con Wopi: 3 preguntas por mes con el plan Gratuito, 20 con Premium. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1/wopi/messages")
public class WopiController {
    private final WopiService wopi;

    @GetMapping
    public ResponseEntity<WopiResponse> chat(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(wopi.chat(uid));
    }

    @PostMapping
    public ResponseEntity<WopiAskResponse> ask(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody WopiAskRequest r) {
        return ResponseEntity.ok(wopi.ask(uid, r.text()));
    }
}
