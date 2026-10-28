package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Un ingrediente que ya compraste en la lista del súper de una semana (week = lunes). */
@Entity
@Table(name = "shopping_checks", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "week_start", "item"}))
public class ShoppingCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "week_start", nullable = false)
    private LocalDate week;

    @Column(nullable = false, length = 80)
    private String item;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getWeek() { return week; }
    public void setWeek(LocalDate week) { this.week = week; }

    public String getItem() { return item; }
    public void setItem(String item) { this.item = item; }
}
