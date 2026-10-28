package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

/** Un mensaje del chat con Wopi: la pregunta de la persona (role "user") o la respuesta (role "wopi"). */
@Entity
@Table(name = "wopi_messages", indexes = @Index(columnList = "user_id, month_key"))
public class WopiMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 4)
    private String role;

    @Column(nullable = false, length = 1000)
    private String text;

    /** Tarjetas y botones de la respuesta, en JSON. */
    @Column(length = 4000)
    private String extra;

    /** De qué venía hablando Wopi, para "dame otras opciones" (ej. "meal:1:2000:2"). */
    @Column(length = 60)
    private String context;

    /** Mes de Buenos Aires ("2026-10"): las preguntas cuentan para el cupo de ese mes. */
    @Column(name = "month_key", nullable = false, length = 7)
    private String month;

    @Column(nullable = false)
    private Instant createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public String getExtra() { return extra; }
    public void setExtra(String extra) { this.extra = extra; }

    public String getContext() { return context; }
    public void setContext(String context) { this.context = context; }

    public String getMonth() { return month; }
    public void setMonth(String month) { this.month = month; }

    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
