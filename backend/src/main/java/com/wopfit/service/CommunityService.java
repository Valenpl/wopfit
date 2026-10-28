package com.wopfit.service;

import java.util.Set;

import com.wopfit.entity.Photo;
import com.wopfit.entity.dto.CommentResponse;
import com.wopfit.entity.dto.CommunityResponse;
import com.wopfit.entity.dto.MarkResponse;
import com.wopfit.entity.dto.PostDetailResponse;
import com.wopfit.entity.dto.PostRequest;
import com.wopfit.entity.dto.PostResponse;

/** Comunidad: publicaciones, comentarios, me gusta, guardados, seguir personas y fotos. */
public interface CommunityService {
    Set<String> TYPES = Set.of("receta", "actividad", "pregunta");

    CommunityResponse community(Long userId, String filter);
    PostDetailResponse detail(Long userId, Long postId);
    PostResponse create(Long userId, PostRequest r);
    void delete(Long userId, Long postId);
    CommentResponse comment(Long userId, Long postId, String text);
    MarkResponse mark(Long userId, Long postId, String kind, boolean on);
    boolean follow(Long userId, Long personId, boolean on);
    Photo photo(String id);
}
