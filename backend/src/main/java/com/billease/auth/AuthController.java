package com.billease.auth;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST API for accounts.
 * signup and login are open to everyone; logout and me need a valid token.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // POST /api/auth/signup   body: { "name": "...", "email": "...", "password": "..." }
    @PostMapping("/signup")
    public ResponseEntity<AuthResponse> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.signup(request));
    }

    // POST /api/auth/login   body: { "email": "...", "password": "..." }
    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    // POST /api/auth/logout   (header: Authorization: Bearer <token>)
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout(AuthInterceptor.readToken(request));
        return ResponseEntity.noContent().build();
    }

    // GET /api/auth/me   -> the logged-in user
    @GetMapping("/me")
    public User me(@RequestAttribute(AuthInterceptor.CURRENT_USER) User user) {
        return user;
    }
}
