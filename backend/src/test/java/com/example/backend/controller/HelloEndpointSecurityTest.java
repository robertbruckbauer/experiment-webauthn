package com.example.backend.controller;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class HelloEndpointSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void shouldRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/hello"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldReturnGreetingForAuthenticatedUser() throws Exception {
        mockMvc.perform(get("/api/hello")
                .with(jwt().jwt(jwt -> jwt
                    .subject("subject-1")
                    .claim("preferred_username", "alice")
                    .claim("typ", "Bearer")
                    .audience(List.of("backend-api")))))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Hello, alice!"))
            .andExpect(jsonPath("$.tokenType").value("Bearer"));
    }
}
