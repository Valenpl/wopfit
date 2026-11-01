package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.util.LinkedHashSet;
import java.util.Set;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Cupón de demostración de un aliado ficticio. Se renueva solo cada `days` días desde `startDate`. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "offers", uniqueConstraints = @UniqueConstraint(name = "uk_offer_code", columnNames = "code"))
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String code;

    /** Cadena con sucursales en el mapa; null = comercio online. */
    @Column(length = 20)
    private String brand;

    @Column(nullable = false, length = 60)
    private String store;

    /** super, diet, gym, ropa o supl. */
    @Column(nullable = false, length = 10)
    private String category;

    @Column(name = "discount_value", nullable = false, length = 10)
    private String off;

    @Column(length = 20)
    private String unit;

    @Column(nullable = false, length = 120)
    private String description;

    private int days;

    @Column(nullable = false)
    private LocalDate startDate;

    /** Ingredientes de la lista del súper que cubre. */
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "offer_ingredients", joinColumns = @JoinColumn(name = "offer_id", foreignKey = @ForeignKey(name = "fk_offer_ingredient_offer")))
    @Column(name = "ingredient", nullable = false, length = 40)
    @OrderBy
    private Set<String> ingredients = new LinkedHashSet<>();

    /** El cupón sirve para ese ingrediente de la lista ("garbanzos" lo cubre "garbanzos"; "bebida vegetal de almendras" también). */
    public boolean covers(String item) {
        return item != null && ingredients.stream().anyMatch(item::contains);
    }
}
