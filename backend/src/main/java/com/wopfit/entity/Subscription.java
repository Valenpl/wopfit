package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Premium de demostración: no hay cobros, solo el período elegido y hasta cuándo dura. */
@Entity
@Table(name = "subscriptions")
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false, length = 12)
    private String period;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(name = "valid_until", nullable = false)
    private LocalDate until;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getPeriod() { return period; }
    public void setPeriod(String period) { this.period = period; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getUntil() { return until; }
    public void setUntil(LocalDate until) { this.until = until; }
}
