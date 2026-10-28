package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Foto de una publicación (ya achicada en el celu). El id es un UUID: se sirve sin sesión pero no se puede adivinar. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "photos")
public class Photo {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id", foreignKey = @ForeignKey(name = "fk_photo_owner"))
    private CommunityProfile owner;

    @Column(nullable = false, length = 20)
    private String contentType;

    @Lob
    @Column(nullable = false, length = 2_000_000)
    private byte[] data;

    @Column(nullable = false)
    private Instant createdAt;
}
