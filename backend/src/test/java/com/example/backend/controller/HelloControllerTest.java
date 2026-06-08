package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

class HelloControllerTest {

    private final HelloController controller = new HelloController();

    @Test
    void shouldReturnHelloWithJwtMetadata() {
        Jwt jwt = Jwt.withTokenValue("token")
            .subject("user-123")
            .header("alg", "RS256")
            .claim("preferred_username", "alice")
            .claim("email", "alice@example.com")
            .claim("scope", "profile email")
            .claim("typ", "Bearer")
            .audience(List.of("backend-api"))
            .issuer("http://localhost:8081/realms/webauthn")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(300))
            .build();

        JwtAuthenticationToken authentication = new JwtAuthenticationToken(
            jwt,
            List.of(new SimpleGrantedAuthority("ROLE_user")),
            "alice"
        );

        assertThat(controller.hello(authentication))
            .containsEntry("message", "Hello, alice!")
            .containsEntry("subject", "user-123")
            .containsEntry("preferredUsername", "alice")
            .containsEntry("email", "alice@example.com")
            .containsEntry("roles", List.of("ROLE_user"))
            .containsEntry("scopes", List.of("profile", "email"))
            .containsEntry("tokenType", "Bearer");
    }
}
