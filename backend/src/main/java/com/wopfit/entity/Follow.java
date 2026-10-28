package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "follows", uniqueConstraints = @UniqueConstraint(name = "uk_follow_pair", columnNames = {"follower_id", "followed_id"}))
public class Follow {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "follower_id", foreignKey = @ForeignKey(name = "fk_follow_follower"))
    private CommunityProfile follower;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "followed_id", foreignKey = @ForeignKey(name = "fk_follow_followed"))
    private CommunityProfile followed;
}
