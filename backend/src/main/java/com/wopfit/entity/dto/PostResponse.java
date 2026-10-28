package com.wopfit.entity.dto;

import java.time.Instant;
import java.util.List;

public record PostResponse(Long id, Long authorId, String author, boolean mine, String goal, String goalName, String type, String title, String body,
        String emoji, String bg, List<String> tags, String photoUrl, int likes, boolean liked, boolean saved, int comments, Instant createdAt) {}
