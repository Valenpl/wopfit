package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Registro de una comida (slot 0 desayuno, 1 almuerzo, 2 cena). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "meal_logs", uniqueConstraints = @UniqueConstraint(name = "uk_meal_log_slot", columnNames = {"user_id", "meal_date", "slot"}))
public class MealLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_meal_log_user"))
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
}
