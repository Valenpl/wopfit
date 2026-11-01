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
@Table(name = "wopi_messages", indexes = @Index(name = "idx_wopi_message_created", columnList = "user_id, created_at"))
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

    /** De qué venía hablando Wopi, para "dame otras opciones": "meal" o "quick". */
    @Column(name = "context_kind", length = 10)
    private String contextKind;

    /** En "meal": la comida (0 desayuno, 1 almuerzo, 2 cena). */
    private Integer contextSlot;

    /** En "meal": el precio máximo que pidió, si pidió uno. */
    private Integer contextPriceLimit;

    /** Por dónde sigue la lista de opciones. */
    private Integer contextOffset;

    /** Las preguntas cuentan para el cupo del mes de esta fecha, en hora de Buenos Aires. */
    @Column(nullable = false)
    private Instant createdAt;
}
