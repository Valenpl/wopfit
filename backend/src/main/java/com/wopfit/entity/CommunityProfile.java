package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Cómo aparece alguien en la comunidad. Las personas de ejemplo no tienen usuario (no se puede entrar con ellas);
 * cada usuario real tiene el suyo, que se crea solo y copia su nombre y objetivos.
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

    /** Nombre y la inicial del apellido ("Martina R."). */
    @Column(nullable = false, length = 40)
    private String name;

    /** Objetivos separados por coma. */
    @Column(length = 80)
    private String goals;

    private int daysPerWeek;

    private boolean demo;
}
