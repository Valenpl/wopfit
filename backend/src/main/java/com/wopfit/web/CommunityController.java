package com.wopfit.web;

import java.util.Map;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.wopfit.domain.Photo;
import com.wopfit.service.CommunityService;
import com.wopfit.web.dto.Dtos.CommentDto;
import com.wopfit.web.dto.Dtos.CommentRequest;
import com.wopfit.web.dto.Dtos.CommunityDto;
import com.wopfit.web.dto.Dtos.MarkResponse;
import com.wopfit.web.dto.Dtos.Message;
import com.wopfit.web.dto.Dtos.PostDetailDto;
import com.wopfit.web.dto.Dtos.PostDto;
import com.wopfit.web.dto.Dtos.PostRequest;
import com.wopfit.web.dto.Dtos.ToggleRequest;

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
    public CommunityDto feed(@AuthenticationPrincipal Long uid, @RequestParam(defaultValue = "para") String f) { return community.community(uid, f); }

    @PutMapping("/community/people/{id}/follow")
    public Map<String, Boolean> follow(@AuthenticationPrincipal Long uid, @PathVariable Long id, @RequestBody ToggleRequest r) {
        return Map.of("following", community.follow(uid, id, r.on()));
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    public PostDto create(@AuthenticationPrincipal Long uid, @Valid @RequestBody PostRequest r) { return community.create(uid, r); }

    @GetMapping("/posts/{id}")
    public PostDetailDto detail(@AuthenticationPrincipal Long uid, @PathVariable Long id) { return community.detail(uid, id); }

    @DeleteMapping("/posts/{id}")
    public Message delete(@AuthenticationPrincipal Long uid, @PathVariable Long id) {
        community.delete(uid, id);
        return new Message("Publicación borrada");
    }

    @PostMapping("/posts/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto comment(@AuthenticationPrincipal Long uid, @PathVariable Long id, @Valid @RequestBody CommentRequest r) {
        return community.comment(uid, id, r.text());
    }

    @PutMapping("/posts/{id}/like")
    public MarkResponse like(@AuthenticationPrincipal Long uid, @PathVariable Long id, @RequestBody ToggleRequest r) {
        return community.mark(uid, id, "like", r.on());
    }

    @PutMapping("/posts/{id}/save")
    public MarkResponse save(@AuthenticationPrincipal Long uid, @PathVariable Long id, @RequestBody ToggleRequest r) {
        return community.mark(uid, id, "save", r.on());
    }

    /** Público (las etiquetas <img> no mandan el token): el id es un UUID que solo conoce quien ve la publicación. */
    @GetMapping("/photos/{id}")
    public ResponseEntity<byte[]> photo(@PathVariable String id) {
        Photo p = community.photo(id);
        return ResponseEntity.ok().contentType(MediaType.parseMediaType(p.getContentType()))
                .cacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePrivate()).body(p.getData());
    }
}
