package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Comercio de demostración: una cadena con sucursales en el mapa o un comercio solo online. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "brands", uniqueConstraints = @UniqueConstraint(name = "uk_brand_code", columnNames = "code"))
public class Brand {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String code;

    @Column(nullable = false, length = 80)
    private String name;

    /** Categoría de sus sucursales: super, verdu, diet o gym. Null en los comercios online. */
    @Column(length = 10)
    private String category;
}
