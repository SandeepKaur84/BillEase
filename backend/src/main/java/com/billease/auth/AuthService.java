package com.billease.auth;

import com.billease.common.exception.BadRequestException;
import com.billease.common.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Locale;
import java.util.Optional;

/**
 * Sign up, log in, log out, and "who is this token?".
 * Passwords are hashed with BCrypt; login tokens are long random strings.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository sessionRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final SecureRandom random = new SecureRandom();
    private final int sessionDays;

    public AuthService(UserRepository userRepository,
                       UserSessionRepository sessionRepository,
                       @Value("${app.session-days:7}") int sessionDays) {
        this.userRepository = userRepository;
        this.sessionRepository = sessionRepository;
        this.sessionDays = sessionDays;
    }

    @Transactional
    public AuthResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.getEmail());
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("An account with this email already exists");
        }
        User user = userRepository.save(new User(
                request.getName().trim(), email, passwordEncoder.encode(request.getPassword())));
        return startSession(user);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        // Same message for "no such email" and "wrong password",
        // so nobody can find out which emails have accounts
        User user = userRepository.findByEmail(normalizeEmail(request.getEmail()))
                .filter(u -> passwordEncoder.matches(request.getPassword(), u.getPasswordHash()))
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        return startSession(user);
    }

    @Transactional
    public void logout(String token) {
        if (token != null) {
            sessionRepository.deleteById(token);
        }
    }

    /** Returns the logged-in user for this token, or empty if the token is unknown or expired. */
    @Transactional
    public Optional<User> findUserByToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        Optional<UserSession> session = sessionRepository.findById(token);
        if (session.isPresent() && session.get().isExpired()) {
            sessionRepository.delete(session.get());
            return Optional.empty();
        }
        return session.map(UserSession::getUser);
    }

    private AuthResponse startSession(User user) {
        byte[] bytes = new byte[32];
        random.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        sessionRepository.save(new UserSession(token, user, LocalDateTime.now().plusDays(sessionDays)));
        return new AuthResponse(token, user);
    }

    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
