package com.wopfit.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

/** Cuenta de la persona usuaria. La contraseña se guarda con BCrypt. Es el UserDetails que carga el filtro del JWT. */
@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "users", uniqueConstraints = @UniqueConstraint(name = "uk_user_email", columnNames = "email"))
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String email;

    @Column(nullable = false)
    private String passwordHash;

    @Column(length = 80)
    private String name;

    private LocalDate birthDate;

    private Integer heightCm;

    private Double weightKg;

    private boolean verified;

    @Column(length = 6)
    private String verificationCode;

    @Column(nullable = false)
    private Instant createdAt;

    // Las cuentas creadas antes de que existieran los roles quedan en null y cuentan como USER (ver getRole).
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Role role = Role.USER;

    public Role getRole() { return role == null ? Role.USER : role; }

    // UserDetails: el usuario es el email y el permiso es el rol ("USER" o "ADMIN", como pide hasAuthority).
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() { return List.of(new SimpleGrantedAuthority(getRole().name())); }

    @Override
    public String getUsername() { return email; }

    @Override
    public String getPassword() { return passwordHash; }

    // La verificación del email la revisa AuthenticationServiceImpl, para responder con su propio mensaje.
    @Override
    public boolean isAccountNonExpired() { return true; }

    @Override
    public boolean isAccountNonLocked() { return true; }

    @Override
    public boolean isCredentialsNonExpired() { return true; }

    @Override
    public boolean isEnabled() { return true; }
}
