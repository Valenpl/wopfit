package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un ingrediente que ya compraste en la lista del súper de una semana (week = lunes). */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "shopping_checks", uniqueConstraints = @UniqueConstraint(name = "uk_shopping_check_item", columnNames = {"user_id", "week_start", "item"}))
public class ShoppingCheck {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_shopping_check_user"))
    private User user;

    @Column(name = "week_start", nullable = false)
    private LocalDate week;

    @Column(nullable = false, length = 80)
    private String item;
}
