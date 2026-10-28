package com.wopfit.entity.dto;

import java.util.List;

public record WopiResponse(boolean premium, int left, int limit, List<WopiMessageResponse> messages) {}
