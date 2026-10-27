package com.wopfit.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "follows", uniqueConstraints = @UniqueConstraint(columnNames = {"follower_id", "followed_id"}))
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id")
    private CommunityProfile follower;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "followed_id")
    private CommunityProfile followed;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CommunityProfile getFollower() { return follower; }
    public void setFollower(CommunityProfile follower) { this.follower = follower; }

    public CommunityProfile getFollowed() { return followed; }
    public void setFollowed(CommunityProfile followed) { this.followed = followed; }
}
