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

import com.wopfit.entity.dto.HabitsRequest;
import com.wopfit.entity.dto.HabitsResponse;
import com.wopfit.service.HabitService;

import jakarta.validation.Valid;

/** Hábitos diarios: agua, caminar y dormir. */
@RestController
@RequestMapping("/api/habits")
public class HabitController {
    private final HabitService habits;

    public HabitController(HabitService habits) {
        this.habits = habits;
    }

    @GetMapping("/{date}")
    public ResponseEntity<HabitsResponse> habits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(habits.get(uid, date));
    }

    @PutMapping("/{date}")
    public ResponseEntity<HabitsResponse> setHabits(@AuthenticationPrincipal Long uid, @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
                               @Valid @RequestBody HabitsRequest body) {
        return ResponseEntity.ok(habits.set(uid, date, body));
    }
}
