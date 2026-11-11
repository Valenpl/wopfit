package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cómo aparece alguien en la comunidad: une sus publicaciones, comentarios y seguidores.
 * Cada usuario real tiene el suyo, que se crea solo. Las personas de ejemplo no tienen usuario (no se puede entrar con ellas)
 * y guardan sus datos en DemoProfile.
 */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "community_profiles", uniqueConstraints = @UniqueConstraint(name = "uk_community_profile_user", columnNames = "user_id"))
public class CommunityProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_community_profile_user"))
    private User user;
}
