package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Publicación de la comunidad: receta, actividad o pregunta, con foto opcional. */
@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id")
    private CommunityProfile author;

    /** Objetivo con el que se publica (el primero del autor). */
    @Column(nullable = false, length = 10)
    private String goal;

    /** receta, actividad o pregunta. */
    @Column(nullable = false, length = 10)
    private String type;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 1000)
    private String body;

    /** Ilustración de las publicaciones de ejemplo (emoji sobre un color). */
    @Column(length = 16)
    private String emoji;

    @Column(length = 9)
    private String bg;

    @Column(length = 120)
    private String tags;

    /** Id público de la foto, si tiene. */
    @Column(length = 36)
    private String photoId;

    /** Me gusta que ya traen las publicaciones de ejemplo. */
    private int baseLikes;

    @Column(nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CommunityProfile getAuthor() { return author; }
    public void setAuthor(CommunityProfile author) { this.author = author; }

    public String getGoal() { return goal; }
    public void setGoal(String goal) { this.goal = goal; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getBg() { return bg; }
    public void setBg(String bg) { this.bg = bg; }

    public String getTags() { return tags; }
    public void setTags(String tags) { this.tags = tags; }

    public String getPhotoId() { return photoId; }
    public void setPhotoId(String photoId) { this.photoId = photoId; }

    public int getBaseLikes() { return baseLikes; }
    public void setBaseLikes(int baseLikes) { this.baseLikes = baseLikes; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
