package com.billease.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests sign up, log in, log out and that the rest of the API is locked without a token.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void signup_returnsToken_andNeverThePassword() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("Ravi Kumar", uniqueEmail(), "secret123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.user.name").value("Ravi Kumar"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.user.password").doesNotExist());
    }

    @Test
    void signup_withSameEmail_returns400_evenWithDifferentCase() throws Exception {
        String email = uniqueEmail();
        signUp(email, "secret123");

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("Someone Else", email.toUpperCase(), "another123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("already exists")));
    }

    @Test
    void signup_withBadData_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("", "not-an-email", "123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Name is required")))
                .andExpect(jsonPath("$.message", containsString("valid email")))
                .andExpect(jsonPath("$.message", containsString("6 to 72 characters")));
    }

    @Test
    void login_withRightPassword_works_andWrongPassword_returns401() throws Exception {
        String email = uniqueEmail();
        signUp(email, "secret123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, "secret123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson(email, "wrong-password")))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    void api_withoutToken_returns401() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/products").header("Authorization", "Bearer made-up-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void me_returnsUser_andLogout_endsTheSession() throws Exception {
        String email = uniqueEmail();
        String token = signUp(email, "secret123");

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/products").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
    }

    /** Signs up through the API and returns the login token. */
    private String signUp(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("Test User", email, password)))
                .andExpect(status().isCreated())
                .andReturn();
        return result.getResponse().getContentAsString().replaceAll(".*\"token\":\"([^\"]+)\".*", "$1");
    }

    private String uniqueEmail() {
        return "user-" + UUID.randomUUID() + "@test.com";
    }

    private String signupJson(String name, String email, String password) {
        return "{\"name\": \"" + name + "\", \"email\": \"" + email + "\", \"password\": \"" + password + "\"}";
    }

    private String loginJson(String email, String password) {
        return "{\"email\": \"" + email + "\", \"password\": \"" + password + "\"}";
    }
}
