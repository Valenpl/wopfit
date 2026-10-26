package com.wopfit.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Registro de una comida (slot 0 desayuno, 1 almuerzo, 2 cena). */
@Entity
@Table(name = "meal_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "meal_date", "slot"}))
public class MealLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "meal_date", nullable = false)
    private LocalDate date;

    private int slot;

    @Enumerated(EnumType.STRING)
    @Column(length = 12)
    private MealStatus status;

    @Column(length = 20)
    private String reason;

    @Column(length = 120)
    private String alternativeName;

    private int swaps;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getSlot() { return slot; }
    public void setSlot(int slot) { this.slot = slot; }

    public MealStatus getStatus() { return status; }
    public void setStatus(MealStatus status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getAlternativeName() { return alternativeName; }
    public void setAlternativeName(String alternativeName) { this.alternativeName = alternativeName; }

    public int getSwaps() { return swaps; }
    public void setSwaps(int swaps) { this.swaps = swaps; }
}
