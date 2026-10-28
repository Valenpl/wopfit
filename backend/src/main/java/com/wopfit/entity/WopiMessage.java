package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un mensaje del chat con Wopi: la pregunta de la persona (role "user") o la respuesta (role "wopi"). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "wopi_messages", indexes = @Index(name = "idx_wopi_message_month", columnList = "user_id, month_key"))
public class WopiMessage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_wopi_message_user"))
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
}
