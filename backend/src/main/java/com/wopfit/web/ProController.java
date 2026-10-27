package com.wopfit.web;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.service.ProService;
import com.wopfit.web.dto.Dtos.BookRequest;
import com.wopfit.web.dto.Dtos.BookResponse;
import com.wopfit.web.dto.Dtos.Message;
import com.wopfit.web.dto.Dtos.ProDetailDto;
import com.wopfit.web.dto.Dtos.ProsDto;

import jakarta.validation.Valid;

/** Ayuda profesional: listado, agenda, reservar y cancelar. Reservar es solo con Premium (2 por mes). */
@RestController
@RequestMapping("/api")
public class ProController {
    private final ProService pros;

    public ProController(ProService pros) {
        this.pros = pros;
    }

    @GetMapping("/pros")
    public ProsDto list(@AuthenticationPrincipal Long uid) { return pros.list(uid); }

    @GetMapping("/pros/{id}")
    public ProDetailDto detail(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return pros.detail(uid, id); }

    @PostMapping("/pros/{id}/book")
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse book(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody BookRequest r) {
        return pros.book(uid, id, r.date(), r.time(), r.mode());
    }

    @DeleteMapping("/consultations/{id}")
    public Message cancel(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        pros.cancel(uid, id);
        return new Message("Consulta cancelada");
    }
}
