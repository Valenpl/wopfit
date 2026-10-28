package com.wopfit.entity.dto;

import java.time.Instant;

public record CommentResponse(Long id, String author, boolean mine, String text, Instant createdAt) {}
