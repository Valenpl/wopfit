package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Nutricionista o entrenador de ejemplo para la demo. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "professionals")
public class Professional {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** nutri o entre. */
    @Column(nullable = false, length = 10)
    private String kind;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 120)
    private String specialty;

    @Column(length = 40)
    private String license;

    private double rating;

    @Column(length = 20)
    private String experience;

    @Column(length = 300)
    private String bio;
}
