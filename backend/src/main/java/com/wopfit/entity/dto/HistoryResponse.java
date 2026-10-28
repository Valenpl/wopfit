package com.wopfit.entity.dto;

import java.util.List;

public record HistoryResponse(List<HistoryWeek> weeks, List<Difficulty> difficulties, String mostCommon, int mostCommonCount) {}
