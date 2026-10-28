package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Consulta reservada con un profesional. Cuenta para el cupo del mes en que se reservó (bookedOn). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "consultations", uniqueConstraints = @UniqueConstraint(name = "uk_consultation_slot", columnNames = {"professional_id", "consult_date", "consult_time"}))
public class Consultation {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_consultation_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "professional_id", foreignKey = @ForeignKey(name = "fk_consultation_professional"))
    private Professional professional;

    @Column(name = "consult_date", nullable = false)
    private LocalDate date;

    /** "HH:mm". */
    @Column(name = "consult_time", nullable = false, length = 5)
    private String time;

    /** Videollamada o Chat. */
    @Column(nullable = false, length = 15)
    private String mode;

    @Column(nullable = false)
    private LocalDate bookedOn;
}
