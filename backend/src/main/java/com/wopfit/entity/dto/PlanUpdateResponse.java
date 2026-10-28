package com.wopfit.entity.dto;

import java.util.List;

public record PlanUpdateResponse(PlanResponse plan, List<Change> changes) {}
