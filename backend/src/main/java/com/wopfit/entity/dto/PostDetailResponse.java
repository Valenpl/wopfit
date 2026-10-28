package com.wopfit.entity.dto;

import java.util.List;

public record PostDetailResponse(PostResponse post, List<CommentResponse> comments) {}
