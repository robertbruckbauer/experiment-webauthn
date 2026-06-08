package com.example.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;

class KeycloakJwtAuthenticationConverterTest {

    @Test
    void shouldMapRealmAndClientRolesWithRolePrefix() {
        KeycloakJwtAuthenticationConverter converter = new KeycloakJwtAuthenticationConverter("frontend-spa");
        Jwt jwt = Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .issuer("http://localhost:8081/realms/webauthn")
            .subject("subject")
            .claim("preferred_username", "alice")
            .claim("realm_access", Map.of("roles", List.of("user")))
            .claim("resource_access", Map.of("frontend-spa", Map.of("roles", List.of("admin"))))
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(60))
            .build();

        Authentication authentication = converter.convert(jwt);

        assertThat(authentication.getName()).isEqualTo("alice");
        assertThat(authentication.getAuthorities())
            .extracting("authority")
            .contains("ROLE_user", "ROLE_admin");
    }
}
