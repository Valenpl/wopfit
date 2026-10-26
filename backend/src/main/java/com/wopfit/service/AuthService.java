package com.wopfit.service;

import java.security.SecureRandom;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.config.ApiException;
import com.wopfit.config.JwtService;
import com.wopfit.domain.User;
import com.wopfit.repo.UserRepository;
import com.wopfit.web.dto.Dtos.AuthResponse;
import com.wopfit.web.dto.Dtos.RegisterResponse;

@Service
public class AuthService {
    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private final SecureRandom random = new SecureRandom();
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final ProfileService profile;
    private final boolean devCodes;

    public AuthService(UserRepository users, PasswordEncoder encoder, JwtService jwt, ProfileService profile,
                       @Value("${wopfit.dev-codes}") boolean devCodes) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.profile = profile;
        this.devCodes = devCodes;
    }

    private String newCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    /** Crea la cuenta sin verificar y "manda" el código (en desarrollo se muestra en el log y en la respuesta). */
    @Transactional
    public RegisterResponse register(String email, String password) {
        String mail = email.trim().toLowerCase();
        User u = users.findByEmailIgnoreCase(mail).orElse(null);
        if (u != null && u.isVerified()) throw ApiException.conflict("Ese email ya tiene una cuenta. Probá ingresar.");
        if (u == null) {
            u = new User();
            u.setEmail(mail);
            u.setCreatedAt(Instant.now());
        }
        u.setPasswordHash(encoder.encode(password));
        u.setVerificationCode(newCode());
        users.save(u);
        log.info("Código de verificación para {}: {}", mail, u.getVerificationCode());
        return new RegisterResponse("Te enviamos un código de 6 números a " + mail, devCodes ? u.getVerificationCode() : null);
    }

    @Transactional
    public RegisterResponse resend(String email) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElseThrow(() -> ApiException.notFound("No encontramos una cuenta con ese email"));
        if (u.isVerified()) return new RegisterResponse("Tu email ya está verificado", null);
        u.setVerificationCode(newCode());
        log.info("Código de verificación para {}: {}", u.getEmail(), u.getVerificationCode());
        return new RegisterResponse("Te reenviamos el código", devCodes ? u.getVerificationCode() : null);
    }

    @Transactional
    public AuthResponse verify(String email, String code) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElseThrow(() -> ApiException.notFound("No encontramos una cuenta con ese email"));
        if (!u.isVerified()) {
            if (u.getVerificationCode() == null || !u.getVerificationCode().equals(code)) {
                throw ApiException.badRequest("El código no coincide. Revisalo o pedí uno nuevo.");
            }
            u.setVerified(true);
            u.setVerificationCode(null);
        }
        return new AuthResponse(jwt.create(u.getId(), u.getEmail()), profile.me(u.getId()));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(String email, String password) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (u == null || !encoder.matches(password, u.getPasswordHash())) {
            throw ApiException.unauthorized("El email o la contraseña no coinciden");
        }
        if (!u.isVerified()) throw ApiException.forbidden("Verificá tu email antes de ingresar");
        return new AuthResponse(jwt.create(u.getId(), u.getEmail()), profile.me(u.getId()));
    }
}
