package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Una sesión de entrenamiento en un día. Si se reprograma, la original queda MOVED y se crea otra con movedFrom. */
@Entity
@Table(name = "workout_sessions")
public class WorkoutSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public int getTemplate() { return template; }
    public void setTemplate(int template) { this.template = template; }

    public SessionStatus getStatus() { return status; }
    public void setStatus(SessionStatus status) { this.status = status; }

    public Integer getFeel() { return feel; }
    public void setFeel(Integer feel) { this.feel = feel; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getReasonNote() { return reasonNote; }
    public void setReasonNote(String reasonNote) { this.reasonNote = reasonNote; }

    public LocalDate getMovedTo() { return movedTo; }
    public void setMovedTo(LocalDate movedTo) { this.movedTo = movedTo; }

    public LocalDate getMovedFrom() { return movedFrom; }
    public void setMovedFrom(LocalDate movedFrom) { this.movedFrom = movedFrom; }

    public String getAlternative() { return alternative; }
    public void setAlternative(String alternative) { this.alternative = alternative; }

    public boolean isAlternativeDone() { return alternativeDone; }
    public void setAlternativeDone(boolean alternativeDone) { this.alternativeDone = alternativeDone; }
}
