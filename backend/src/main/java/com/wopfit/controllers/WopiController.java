package com.wopfit.controllers;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.entity.dto.WopiAskRequest;
import com.wopfit.entity.dto.WopiAskResponse;
import com.wopfit.entity.dto.WopiResponse;
import com.wopfit.service.WopiService;

import jakarta.validation.Valid;

/** Chat con Wopi: 3 preguntas por mes con el plan Gratuito, 20 con Premium. */
@RestController
@RequestMapping("/api")
public class WopiController {
    private final WopiService wopi;

    public WopiController(WopiService wopi) {
        this.wopi = wopi;
    }

    @GetMapping("/wopi")
    public WopiResponse chat(@AuthenticationPrincipal Long uid) { return wopi.chat(uid); }

    @PostMapping("/wopi")
    public WopiAskResponse ask(@AuthenticationPrincipal Long uid, @Valid @RequestBody WopiAskRequest r) { return wopi.ask(uid, r.text()); }
}
