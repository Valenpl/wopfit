package com.wopfit.entity.dto;

import java.util.List;

public record ProDetailResponse(ProResponse pro, List<SlotDay> days, List<String> modes, boolean premium, int left) {}
