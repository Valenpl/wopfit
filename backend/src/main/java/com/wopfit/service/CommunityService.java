package com.wopfit.service;

import java.util.Set;

import org.springframework.data.domain.Pageable;

import com.wopfit.entity.dto.CommentResponse;
import com.wopfit.entity.dto.MarkResponse;
import com.wopfit.entity.dto.PageResponse;
import com.wopfit.entity.dto.PeopleResponse;
import com.wopfit.entity.dto.PostDetailResponse;
import com.wopfit.entity.dto.PostRequest;
import com.wopfit.entity.dto.PhotoResponse;
import com.wopfit.entity.dto.PostResponse;

/** Comunidad: publicaciones, comentarios, me gusta, guardados, seguir personas y fotos. */
public interface CommunityService {
    Set<String> TYPES = Set.of("receta", "actividad", "pregunta");

    PeopleResponse people(Long userId);
    /** `filter`: para (por defecto), recetas, act o preg. */
    PageResponse<PostResponse> feed(Long userId, String filter, Pageable pageable);
    PostDetailResponse detail(Long userId, Long postId);
    PostResponse create(Long userId, PostRequest r);
    void delete(Long userId, Long postId);
    CommentResponse comment(Long userId, Long postId, String text);
    MarkResponse mark(Long userId, Long postId, String kind, boolean on);
    boolean follow(Long userId, Long personId, boolean on);
    PhotoResponse photo(String id);
}
