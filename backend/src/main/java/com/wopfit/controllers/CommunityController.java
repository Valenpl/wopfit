package com.wopfit.controllers;

import java.util.concurrent.TimeUnit;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;

import com.wopfit.entity.dto.CommentRequest;
import com.wopfit.entity.dto.CommentResponse;
import com.wopfit.entity.dto.DeleteResponse;
import com.wopfit.entity.dto.FollowResponse;
import com.wopfit.entity.dto.MarkResponse;
import com.wopfit.entity.dto.PageResponse;
import com.wopfit.entity.dto.PeopleResponse;
import com.wopfit.entity.dto.PhotoResponse;
import com.wopfit.entity.dto.PostDetailResponse;
import com.wopfit.entity.dto.PostRequest;
import com.wopfit.entity.dto.PostResponse;
import com.wopfit.entity.dto.ToggleRequest;
import com.wopfit.service.CommunityService;

import jakarta.validation.Valid;

/** Comunidad: personas como vos, feed paginado, publicaciones con foto, comentarios, me gusta, guardados y seguir personas. */
@RequiredArgsConstructor
@RestController
@RequestMapping("/api/v1")
public class CommunityController {
    private final CommunityService community;

    /** Personas como vos (las 5 que más objetivos comparten). */
    @GetMapping("/people")
    public ResponseEntity<PeopleResponse> people(@AuthenticationPrincipal(expression = "id") Long uid) {
        return ResponseEntity.ok(community.people(uid));
    }

    @PutMapping("/people/{id}/follow")
    public ResponseEntity<FollowResponse> follow(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(new FollowResponse(community.follow(uid, id, r.on())));
    }

    /** Feed paginado (?page=0&size=10). `filter`: para (por defecto), recetas, act o preg. */
    @GetMapping("/posts")
    public ResponseEntity<PageResponse<PostResponse>> feed(@AuthenticationPrincipal(expression = "id") Long uid,
                                                           @RequestParam(defaultValue = "para") String filter,
                                                           @PageableDefault(size = 10) Pageable pageable) {
        return ResponseEntity.ok(community.feed(uid, filter, pageable));
    }

    @PostMapping("/posts")
    public ResponseEntity<PostResponse> create(@AuthenticationPrincipal(expression = "id") Long uid, @Valid @RequestBody PostRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(community.create(uid, r));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostDetailResponse> detail(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(community.detail(uid, id));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<DeleteResponse> delete(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id) {
        community.delete(uid, id);
        return ResponseEntity.ok(new DeleteResponse(id, "Publicación borrada"));
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<CommentResponse> comment(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody CommentRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(community.comment(uid, id, r.text()));
    }

    @PutMapping("/posts/{id}/like")
    public ResponseEntity<MarkResponse> like(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(community.mark(uid, id, "like", r.on()));
    }

    @PutMapping("/posts/{id}/save")
    public ResponseEntity<MarkResponse> save(@AuthenticationPrincipal(expression = "id") Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(community.mark(uid, id, "save", r.on()));
    }

    /** Público (las etiquetas <img> no mandan el token): el id es un UUID que solo conoce quien ve la publicación. */
    @GetMapping("/photos/{id}")
    public ResponseEntity<byte[]> photo(@PathVariable String id) {
        PhotoResponse p = community.photo(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(p.contentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePrivate()).body(p.data());
    }
}
