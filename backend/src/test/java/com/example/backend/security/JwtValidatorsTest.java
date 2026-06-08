package com.example.backend.security;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

class JwtValidatorsTest {

    @Test
    void audienceValidatorShouldAcceptConfiguredAudience() {
        JwtAudienceValidator validator = new JwtAudienceValidator("backend-api");
        Jwt jwt = jwtBuilder().audience(List.of("backend-api")).build();

        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isFalse();
    }

    @Test
    void accessTokenTypeValidatorShouldRejectNonBearerTokens() {
        JwtAccessTokenTypeValidator validator = new JwtAccessTokenTypeValidator();
        Jwt jwt = jwtBuilder().claim("typ", "Refresh").build();

        OAuth2TokenValidatorResult result = validator.validate(jwt);

        assertThat(result.hasErrors()).isTrue();
    }

    private Jwt.Builder jwtBuilder() {
        Instant now = Instant.now();
        return Jwt.withTokenValue("token")
            .header("alg", "RS256")
            .issuer("http://localhost:8081/realms/webauthn")
            .subject("subject")
            .issuedAt(now)
            .expiresAt(now.plusSeconds(60));
    }
}
