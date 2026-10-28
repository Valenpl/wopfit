package com.wopfit.entity;

import jakarta.persistence.*;

/** "Me gusta" (like) o "Guardado" (save) de una persona en una publicación. */
@Entity
@Table(name = "post_marks", uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "profile_id", "kind"}))
public class PostMark {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "post_id")
    private Post post;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id")
    private CommunityProfile profile;

    @Column(nullable = false, length = 5)
    private String kind;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Post getPost() { return post; }
    public void setPost(Post post) { this.post = post; }

    public CommunityProfile getProfile() { return profile; }
    public void setProfile(CommunityProfile profile) { this.profile = profile; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }
}
