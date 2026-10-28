package com.wopfit.entity.dto;

import java.util.List;

import org.springframework.data.domain.Page;

/** Una página de una lista larga (REGLAS 2.9). `page` empieza en 0; `last` dice si no hay más. */
public record PageResponse<T>(List<T> content, int page, int size, long totalElements, boolean last) {
    public static <T> PageResponse<T> of(Page<T> p) {
        return new PageResponse<>(p.getContent(), p.getNumber(), p.getSize(), p.getTotalElements(), p.isLast());
    }
}
