package com.wopfit.entity;

import jakarta.persistence.*;

/** Un lugar de demostración del mapa "Cerca tuyo": comercio ficticio en una dirección real, o un parque. */
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

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getBrand() { return brand; }
    public void setBrand(String brand) { this.brand = brand; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getBarrio() { return barrio; }
    public void setBarrio(String barrio) { this.barrio = barrio; }

    public double getLat() { return lat; }
    public void setLat(double lat) { this.lat = lat; }

    public double getLng() { return lng; }
    public void setLng(double lng) { this.lng = lng; }

    public String getOpens() { return opens; }
    public void setOpens(String opens) { this.opens = opens; }

    public String getCloses() { return closes; }
    public void setCloses(String closes) { this.closes = closes; }

    public boolean isDiscount() { return discount; }
    public void setDiscount(boolean discount) { this.discount = discount; }
}
