package com.wopfit.service;

import java.util.List;

import com.wopfit.entity.Goal;
import com.wopfit.entity.dto.GoalRequest;
import com.wopfit.entity.dto.GoalResponse;

/** Metas chiquitas ("caminar 20 min, 3 veces por semana, 4 semanas") que suman a un objetivo. */
public interface GoalService {
    GoalResponse dto(Goal g);
    List<GoalResponse> list(Long userId);
    List<Goal> entities(Long userId);
    GoalResponse create(Long userId, GoalRequest r);
    GoalResponse check(Long userId, Long id);
    void delete(Long userId, Long id);
}
