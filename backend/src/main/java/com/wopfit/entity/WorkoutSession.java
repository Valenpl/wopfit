package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Una sesión de entrenamiento en un día. Si se reprograma, la original queda MOVED y se crea otra con movedFrom. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "workout_sessions")
public class WorkoutSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_workout_session_user"))
    private User user;

    @Column(name = "session_date", nullable = false)
    private LocalDate date;

    private int template;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private SessionStatus status;

    private Integer feel;

    @Column(length = 300)
    private String note;

    @Column(length = 20)
    private String reason;

    @Column(length = 300)
    private String reasonNote;

    private LocalDate movedTo;

    private LocalDate movedFrom;

    @Column(length = 20)
    private String alternative;

    private boolean alternativeDone;
}
