package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Foto de una publicación (ya achicada en el celu). El id es un UUID: se sirve sin sesión pero no se puede adivinar. */
@Entity
@Table(name = "photos")
public class Photo {
    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "owner_id")
    private CommunityProfile owner;

    @Column(nullable = false, length = 20)
    private String contentType;

    @Lob
    @Column(nullable = false, length = 2_000_000)
    private byte[] data;

    @Column(nullable = false)
    private Instant createdAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public CommunityProfile getOwner() { return owner; }
    public void setOwner(CommunityProfile owner) { this.owner = owner; }

    public String getContentType() { return contentType; }
    public void setContentType(String contentType) { this.contentType = contentType; }

    public byte[] getData() { return data; }
    public void setData(byte[] data) { this.data = data; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
