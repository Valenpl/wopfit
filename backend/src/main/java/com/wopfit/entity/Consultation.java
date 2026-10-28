package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Consulta reservada con un profesional. Cuenta para el cupo del mes en que se reservó (bookedOn). */
@Entity
@Table(name = "consultations", uniqueConstraints = @UniqueConstraint(columnNames = {"professional_id", "consult_date", "consult_time"}))
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professional_id")
    private Professional professional;

    @Column(name = "consult_date", nullable = false)
    private LocalDate date;

    /** "HH:mm". */
    @Column(name = "consult_time", nullable = false, length = 5)
    private String time;

    /** Videollamada o Chat. */
    @Column(nullable = false, length = 15)
    private String mode;

    @Column(nullable = false)
    private LocalDate bookedOn;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Professional getProfessional() { return professional; }
    public void setProfessional(Professional professional) { this.professional = professional; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getTime() { return time; }
    public void setTime(String time) { this.time = time; }

    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }

    public LocalDate getBookedOn() { return bookedOn; }
    public void setBookedOn(LocalDate bookedOn) { this.bookedOn = bookedOn; }
}
