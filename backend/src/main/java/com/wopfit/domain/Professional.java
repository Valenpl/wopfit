package com.wopfit.domain;

import jakarta.persistence.*;

/** Nutricionista o entrenador de ejemplo para la demo. */
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getKind() { return kind; }
    public void setKind(String kind) { this.kind = kind; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSpecialty() { return specialty; }
    public void setSpecialty(String specialty) { this.specialty = specialty; }

    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }

    public double getRating() { return rating; }
    public void setRating(double rating) { this.rating = rating; }

    public String getExperience() { return experience; }
    public void setExperience(String experience) { this.experience = experience; }

    public String getBio() { return bio; }
    public void setBio(String bio) { this.bio = bio; }
}
