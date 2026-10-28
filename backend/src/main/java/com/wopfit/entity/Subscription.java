package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Premium de demostración: no hay cobros, solo el período elegido y hasta cuándo dura. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "subscriptions", uniqueConstraints = @UniqueConstraint(name = "uk_subscription_user", columnNames = "user_id"))
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_subscription_user"))
    private User user;

    @Column(nullable = false, length = 12)
    private String period;

    @Column(nullable = false)
    private LocalDate startDate;

    @Column(name = "valid_until", nullable = false)
    private LocalDate until;
}
