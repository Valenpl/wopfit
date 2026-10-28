package com.wopfit.entity;

import jakarta.persistence.*;

/**
 * Cómo aparece alguien en la comunidad. Las personas de ejemplo no tienen usuario (no se puede entrar con ellas);
 * cada usuario real tiene el suyo, que se crea solo y copia su nombre y objetivos.
 */
@Entity
@Table(name = "community_profiles")
public class CommunityProfile {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    /** Nombre y la inicial del apellido ("Martina R."). */
    @Column(nullable = false, length = 40)
    private String name;

    /** Objetivos separados por coma. */
    @Column(length = 80)
    private String goals;

    private int daysPerWeek;

    private boolean demo;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getGoals() { return goals; }
    public void setGoals(String goals) { this.goals = goals; }

    public int getDaysPerWeek() { return daysPerWeek; }
    public void setDaysPerWeek(int daysPerWeek) { this.daysPerWeek = daysPerWeek; }

    public boolean isDemo() { return demo; }
    public void setDemo(boolean demo) { this.demo = demo; }
}
