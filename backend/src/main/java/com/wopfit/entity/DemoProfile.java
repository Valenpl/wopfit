package com.wopfit.entity;

import jakarta.persistence.*;
import java.util.HashSet;
import java.util.Set;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Los datos de una persona de ejemplo de la comunidad: no tiene cuenta, así que no hay otro lugar de donde sacarlos. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "demo_profiles")
public class DemoProfile {
    @Id
    @Column(name = "profile_id")
    private Long id;

    @MapsId
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "profile_id", foreignKey = @ForeignKey(name = "fk_demo_profile_profile"))
    private CommunityProfile profile;

    /** Nombre y la inicial del apellido ("Martina R."). */
    @Column(nullable = false, length = 40)
    private String name;

    private int daysPerWeek;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "demo_profile_goals", joinColumns = @JoinColumn(name = "profile_id", foreignKey = @ForeignKey(name = "fk_demo_profile_goal_demo_profile")))
    @Column(name = "goal", nullable = false, length = 10)
    private Set<String> goals = new HashSet<>();
}
