package com.billease.auth;

/**
 * JSON returned after sign up or log in:
 * { "token": "...", "user": { "id": 1, "name": "...", "email": "...", "createdAt": "..." } }
 */
public class AuthResponse {

    private final String token;
    private final User user;

    public AuthResponse(String token, User user) {
        this.token = token;
        this.user = user;
    }

    public String getToken() { return token; }
    public User getUser() { return user; }
}
