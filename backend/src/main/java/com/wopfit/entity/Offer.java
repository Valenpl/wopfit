package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.LocalDate;

/** Cupón de demostración de un aliado ficticio. Se renueva solo cada `days` días desde `startDate`. */
@Entity
@Table(name = "offers")
public class Offer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
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

    /** Ingredientes de la lista del súper que cubre, separados por coma. */
    @Column(length = 200)
    private String ingredients;

    /** El cupón sirve para ese ingrediente de la lista ("garbanzos" lo cubre "garbanzos"; "bebida vegetal de almendras" también). */
    public boolean covers(String item) {
        if (ingredients == null || item == null) return false;
        for (String g : ingredients.split(",")) {
            if (!g.isBlank() && item.contains(g.trim())) return true;
        }
        return false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCode() { return code; }
    public void setCode(String code) { this.code = code; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getStore() { return store; }
    public void setStore(String store) { this.store = store; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getOff() { return off; }
    public void setOff(String off) { this.off = off; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public int getDays() { return days; }
    public void setDays(int days) { this.days = days; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public String getIngredients() { return ingredients; }
    public void setIngredients(String ingredients) { this.ingredients = ingredients; }
}
