package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Meta concreta (ej. caminar 20 min, 3 veces por semana durante 4 semanas). Suma al objetivo del mismo nombre. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "goals")
public class Goal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_goal_user"))
    private User user;

    @Column(nullable = false, length = 20)
    private String objective;

    @Column(nullable = false, length = 120)
    private String what;

    private int timesPerWeek;

    private int weeks;

    @Column(nullable = false)
    private LocalDate startDate;

    private boolean done;

    private LocalDate doneAt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "goal_checks", joinColumns = @JoinColumn(name = "goal_id", foreignKey = @ForeignKey(name = "fk_goal_check_goal")))
    @Column(name = "check_date")
    private Set<LocalDate> checks = new HashSet<>();
}
