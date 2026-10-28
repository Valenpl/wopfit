package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Hábitos del día: 2 L de agua, caminar 20 min y dormir 7 h. */
@Entity
@Table(name = "habit_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "habit_date"}))
public class HabitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "habit_date", nullable = false)
    private LocalDate date;

    private boolean water;

    private boolean walk;

    private boolean sleep;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public boolean isWater() { return water; }
    public void setWater(boolean water) { this.water = water; }

    public boolean isWalk() { return walk; }
    public void setWalk(boolean walk) { this.walk = walk; }

    public boolean isSleep() { return sleep; }
    public void setSleep(boolean sleep) { this.sleep = sleep; }
}
