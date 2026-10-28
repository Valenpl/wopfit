package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un lugar de demostración del mapa "Cerca tuyo": comercio ficticio en una dirección real, o un parque. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "places")
public class Place {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Cadena a la que pertenece (sucursales con las mismas ofertas). Null en los parques. */
    @Column(length = 20)
    private String brand;

    @Column(nullable = false, length = 80)
    private String name;

    /** super, verdu, diet, gym o parque. */
    @Column(nullable = false, length = 10)
    private String category;

    @Column(nullable = false, length = 120)
    private String address;

    @Column(length = 40)
    private String barrio;

    private double lat;

    private double lng;

    /** "HH:mm". 00:00 a 24:00 = abierto siempre. */
    @Column(length = 5)
    private String opens;

    @Column(length = 5)
    private String closes;

    /** Tiene descuento para usuarios WopFit. */
    private boolean discount;
}
