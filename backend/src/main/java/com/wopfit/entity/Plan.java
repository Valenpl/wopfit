package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

/** Plan vigente: días, duración y nivel. generatedUntil marca hasta qué fecha ya se crearon sesiones. */
@Entity
@Table(name = "plans")
public class Plan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", unique = true)
    private User user;

    @Column(nullable = false)
    private LocalDate startDate;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "plan_days", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "day_of_week")
    private Set<Integer> days = new HashSet<>();

    @Column(name = "minutes_per_session")
    private int minutes;

    @Column(length = 20)
    private String level;

    @Column(nullable = false)
    private LocalDate generatedUntil;

    private LocalDate adjustSeenWeek;

    private LocalDate lightenSeenWeek;

    private Instant updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public Set<Integer> getDays() { return days; }
    public void setDays(Set<Integer> days) { this.days = days; }

    public int getMinutes() { return minutes; }
    public void setMinutes(int minutes) { this.minutes = minutes; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public LocalDate getGeneratedUntil() { return generatedUntil; }
    public void setGeneratedUntil(LocalDate generatedUntil) { this.generatedUntil = generatedUntil; }

    public LocalDate getAdjustSeenWeek() { return adjustSeenWeek; }
    public void setAdjustSeenWeek(LocalDate adjustSeenWeek) { this.adjustSeenWeek = adjustSeenWeek; }

    public LocalDate getLightenSeenWeek() { return lightenSeenWeek; }
    public void setLightenSeenWeek(LocalDate lightenSeenWeek) { this.lightenSeenWeek = lightenSeenWeek; }

    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
