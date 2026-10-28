package com.wopfit.entity.dto;

import java.util.List;
import java.util.Set;

public record PreferencesResponse(Set<String> goals, List<Integer> days, int minutes, String budget, Set<String> activities,
        Set<String> avoid, String otherAvoid, Set<String> health, String level, Set<String> equipment, Set<String> pendingChanges) {}
