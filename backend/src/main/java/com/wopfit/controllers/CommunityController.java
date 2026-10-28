package com.wopfit.controllers;

import java.util.concurrent.TimeUnit;

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

import com.wopfit.entity.dto.FollowResponse;
import com.wopfit.entity.Photo;
import com.wopfit.entity.dto.CommentRequest;
import com.wopfit.entity.dto.CommentResponse;
import com.wopfit.entity.dto.CommunityResponse;
import com.wopfit.entity.dto.MarkResponse;
import com.wopfit.entity.dto.MessageResponse;
import com.wopfit.entity.dto.PostDetailResponse;
import com.wopfit.entity.dto.PostRequest;
import com.wopfit.entity.dto.PostResponse;
import com.wopfit.entity.dto.ToggleRequest;
import com.wopfit.service.CommunityService;

import jakarta.validation.Valid;

/** Comunidad: feed, publicaciones con foto, comentarios, me gusta, guardados y seguir personas. */
@RestController
@RequestMapping("/api")
public class CommunityController {
    private final CommunityService community;

    public CommunityController(CommunityService community) {
        this.community = community;
    }

    /** `f`: para (por defecto), recetas, act o preg. */
    @GetMapping("/community")
    public ResponseEntity<CommunityResponse> feed(@AuthenticationPrincipal Long uid, @RequestParam(defaultValue = "para") String f) {
        return ResponseEntity.ok(community.community(uid, f));
    }

    @PutMapping("/community/people/{id}/follow")
    public ResponseEntity<FollowResponse> follow(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(new FollowResponse(community.follow(uid, id, r.on())));
    }

    @PostMapping("/posts")
    public ResponseEntity<PostResponse> create(@AuthenticationPrincipal Long uid, @Valid @RequestBody PostRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(community.create(uid, r));
    }

    @GetMapping("/posts/{id}")
    public ResponseEntity<PostDetailResponse> detail(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        return ResponseEntity.ok(community.detail(uid, id));
    }

    @DeleteMapping("/posts/{id}")
    public ResponseEntity<MessageResponse> delete(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        community.delete(uid, id);
        return ResponseEntity.ok(new MessageResponse("Publicación borrada"));
    }

    @PostMapping("/posts/{id}/comments")
    public ResponseEntity<CommentResponse> comment(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody CommentRequest r) {
        return ResponseEntity.status(HttpStatus.CREATED).body(community.comment(uid, id, r.text()));
    }

    @PutMapping("/posts/{id}/like")
    public ResponseEntity<MarkResponse> like(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(community.mark(uid, id, "like", r.on()));
    }

    @PutMapping("/posts/{id}/save")
    public ResponseEntity<MarkResponse> save(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody ToggleRequest r) {
        return ResponseEntity.ok(community.mark(uid, id, "save", r.on()));
    }

    /** Público (las etiquetas <img> no mandan el token): el id es un UUID que solo conoce quien ve la publicación. */
    @GetMapping("/photos/{id}")
    public ResponseEntity<byte[]> photo(@PathVariable String id) {
        Photo p = community.photo(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(p.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePrivate()).body(p.getData());
    }
}
