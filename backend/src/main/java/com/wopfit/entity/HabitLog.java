package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Hábitos del día: 2 L de agua, caminar 20 min y dormir 7 h. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "habit_logs", uniqueConstraints = @UniqueConstraint(name = "uk_habit_log_day", columnNames = {"user_id", "habit_date"}))
public class HabitLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_habit_log_user"))
    private User user;

    @Column(name = "habit_date", nullable = false)
    private LocalDate date;

    private boolean water;

    private boolean walk;

    private boolean sleep;
}
