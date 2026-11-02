package com.wopfit.entity;

import jakarta.persistence.*;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Un lugar de demostración del mapa "Cerca tuyo": sucursal de un comercio ficticio en una dirección real, o un parque. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "places")
public class Place {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Marca a la que pertenece (sucursales con las mismas ofertas). Null en los parques. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", foreignKey = @ForeignKey(name = "fk_place_brand"))
    private Brand brand;

    /** Solo en los parques: las sucursales usan el nombre de su marca. */
    @Column(length = 80)
    private String name;

    /** Solo en los parques ("parque"): las sucursales usan la categoría de su marca. */
    @Column(length = 10)
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

    public String displayName() {
        return brand == null ? name : brand.getName();
    }

    public String displayCategory() {
        return brand == null ? category : brand.getCategory();
    }
}
