package com.wopfit.service;

import java.security.SecureRandom;
import java.time.Instant;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.wopfit.controllers.auth.AuthenticationResponse;
import com.wopfit.controllers.auth.RegisterResponse;
import com.wopfit.controllers.config.JwtService;
import com.wopfit.entity.User;
import com.wopfit.exceptions.EmailAlreadyUsedException;
import com.wopfit.exceptions.EmailNotVerifiedException;
import com.wopfit.exceptions.InvalidCredentialsException;
import com.wopfit.exceptions.InvalidDataException;
import com.wopfit.exceptions.UserNotFoundException;
import com.wopfit.repository.UserRepository;

@Service
public class AuthenticationServiceImpl implements AuthenticationService {
    private static final Logger log = LoggerFactory.getLogger(AuthenticationServiceImpl.class);
    private final SecureRandom random = new SecureRandom();
    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final JwtService jwt;
    private final AuthenticationManager authenticationManager;
    private final ProfileService profile;
    private final boolean devCodes;

    public AuthenticationServiceImpl(UserRepository users, PasswordEncoder encoder, JwtService jwt,
                       AuthenticationManager authenticationManager, ProfileService profile,
                       @Value("${wopfit.dev-codes}") boolean devCodes) {
        this.users = users;
        this.encoder = encoder;
        this.jwt = jwt;
        this.authenticationManager = authenticationManager;
        this.profile = profile;
        this.devCodes = devCodes;
    }

    private String newCode() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    /** Crea la cuenta sin verificar y "manda" el código (en desarrollo se muestra en el log y en la respuesta). */
    @Transactional
    @Override
    public RegisterResponse register(String email, String password) {
        String mail = email.trim().toLowerCase();
        User u = users.findByEmailIgnoreCase(mail).orElse(null);
        if (u != null && u.isVerified()) throw new EmailAlreadyUsedException();
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
    @Override
    public RegisterResponse resend(String email) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElseThrow(() -> new UserNotFoundException());
        if (u.isVerified()) return new RegisterResponse("Tu email ya está verificado", null);
        u.setVerificationCode(newCode());
        log.info("Código de verificación para {}: {}", u.getEmail(), u.getVerificationCode());
        return new RegisterResponse("Te reenviamos el código", devCodes ? u.getVerificationCode() : null);
    }

    @Transactional
    @Override
    public AuthenticationResponse verify(String email, String code) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElseThrow(() -> new UserNotFoundException());
        if (!u.isVerified()) {
            if (u.getVerificationCode() == null || !u.getVerificationCode().equals(code)) {
                throw new InvalidDataException("El código no coincide. Revisalo o pedí uno nuevo.");
            }
            u.setVerified(true);
            u.setVerificationCode(null);
        }
        return new AuthenticationResponse(jwt.generateToken(u), profile.me(u.getId()));
    }

    /** Manda un código para elegir una contraseña nueva. Responde lo mismo si el email no tiene cuenta, así no se puede averiguar quién está registrado. */
    @Transactional
    @Override
    public RegisterResponse forgot(String email) {
        String mail = email.trim().toLowerCase();
        User u = users.findByEmailIgnoreCase(mail).orElse(null);
        if (u != null) {
            u.setVerificationCode(newCode());
            log.info("Código para cambiar la contraseña de {}: {}", mail, u.getVerificationCode());
        }
        return new RegisterResponse("Si " + mail + " tiene una cuenta, te mandamos un código de 6 números", devCodes && u != null ? u.getVerificationCode() : null);
    }

    /**
     * Cambia la contraseña con el código del email y deja la sesión iniciada (el código también confirma el email).
     * Un código equivocado se borra, así no se puede probar hasta adivinarlo: hay que pedir otro.
     */
    @Transactional(noRollbackFor = InvalidDataException.class)
    @Override
    public AuthenticationResponse reset(String email, String code, String password) {
        User u = users.findByEmailIgnoreCase(email.trim()).orElse(null);
        if (u == null || u.getVerificationCode() == null || !u.getVerificationCode().equals(code)) {
            if (u != null) u.setVerificationCode(null);
            throw new InvalidDataException("El código no coincide. Pedí uno nuevo.");
        }
        u.setPasswordHash(encoder.encode(password));
        u.setVerified(true);
        u.setVerificationCode(null);
        return new AuthenticationResponse(jwt.generateToken(u), profile.me(u.getId()));
    }

    /** Pide la contraseña actual. Si no coincide es 400 y no 401: la sesión sigue siendo válida. */
    @Transactional
    @Override
    public void changePassword(Long userId, String current, String password) {
        User u = profile.user(userId);
        if (!encoder.matches(current, u.getPasswordHash())) throw new InvalidDataException("Tu contraseña actual no coincide");
        if (encoder.matches(password, u.getPasswordHash())) throw new InvalidDataException("La nueva contraseña tiene que ser distinta de la actual");
        u.setPasswordHash(encoder.encode(password));
    }

    /** El AuthenticationManager revisa email y contraseña (ver ApplicationConfig); después se pide el email verificado. */
    @Transactional(readOnly = true)
    @Override
    public AuthenticationResponse authenticate(String email, String password) {
        User u;
        try {
            u = (User) authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email.trim(), password)).getPrincipal();
        } catch (AuthenticationException e) {
            throw new InvalidCredentialsException();
        }
        if (!u.isVerified()) throw new EmailNotVerifiedException();
        return new AuthenticationResponse(jwt.generateToken(u), profile.me(u.getId()));
    }
}
