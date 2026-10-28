package com.wopfit.service;

import java.time.LocalDate;
import java.util.List;

import com.wopfit.entity.dto.BookResponse;
import com.wopfit.entity.dto.CancelResponse;
import com.wopfit.entity.dto.ProDetailResponse;
import com.wopfit.entity.dto.ProsResponse;

/**
 * Ayuda profesional: nutricionistas y entrenadores de ejemplo, sus turnos y las reservas.
 * Con Premium hay 2 consultas por mes. La agenda trae algunos turnos ya ocupados para que la demo se vea real.
 */
public interface ProService {
    List<String> TIMES = List.of("10:00", "14:30", "18:00", "19:00", "20:30");
    List<String> MODES = List.of("Videollamada", "Chat");

    ProsResponse list(Long userId);
    ProDetailResponse detail(Long userId, Long proId);
    BookResponse book(Long userId, Long proId, LocalDate date, String t, String mode);
    CancelResponse cancel(Long userId, Long consultId);
}
