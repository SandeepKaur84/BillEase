package com.billease.auth;

import com.billease.common.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Runs before every protected /api/... call (see WebConfig).
 * It reads "Authorization: Bearer <token>", finds the logged-in user and stores
 * it on the request. With no valid token the call stops with HTTP 401.
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_USER = "currentUser";

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // CORS "preflight" checks from the browser carry no token; let them through
        if ("OPTIONS".equals(request.getMethod())) {
            return true;
        }
        User user = authService.findUserByToken(readToken(request))
                .orElseThrow(() -> new UnauthorizedException("Please log in to continue"));
        request.setAttribute(CURRENT_USER, user);
        return true;
    }

    /** "Bearer abc123" -> "abc123", or null when the header is missing. */
    static String readToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring("Bearer ".length()).trim();
    }
}
