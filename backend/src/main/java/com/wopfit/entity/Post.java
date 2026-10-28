package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Publicación de la comunidad: receta, actividad o pregunta, con foto opcional. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "posts")
public class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", foreignKey = @ForeignKey(name = "fk_post_author"))
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
}
