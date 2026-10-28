package com.wopfit.service;

import com.wopfit.entity.dto.HistoryResponse;
import com.wopfit.entity.dto.PlanResponse;
import com.wopfit.entity.dto.ProgressResponse;

/** Progreso, historial y ajustes automáticos del plan (alivianar cuando cuesta, crecer cuando va bien). */
public interface ProgressService {
    ProgressResponse progress(Long userId);
    PlanResponse lighten(Long userId);
    PlanResponse grow(Long userId);
    void dismiss(Long userId, String type);
    HistoryResponse history(Long userId);
}
