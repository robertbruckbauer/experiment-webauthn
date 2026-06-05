package com.example.backend.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.TestingAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;

class HelloControllerTest {

    private final HelloController controller = new HelloController();

    @Test
    void shouldReturnHelloWithJwtMetadata() {
        Jwt jwt = Jwt.withTokenValue("token")
            .subject("user-123")
            .header("alg", "RS256")
            .claim("preferred_username", "alice")
            .claim("typ", "Bearer")
            .audience(List.of("backend-api"))
            .issuer("http://localhost:8081/realms/webauthn")
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(300))
            .build();

        TestingAuthenticationToken authentication = new TestingAuthenticationToken(
            "alice",
            "n/a",
            new SimpleGrantedAuthority("ROLE_user")
        );

        assertThat(controller.hello(authentication, jwt))
            .containsEntry("message", "Hello, alice!")
            .containsEntry("subject", "user-123")
            .containsEntry("tokenType", "Bearer");
    }
}
