package com.example.backend.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

public class JwtAccessTokenTypeValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error ERROR = new OAuth2Error("invalid_token", "Only access tokens are accepted", null);

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        String typ = token.getClaimAsString("typ");
        if ("Bearer".equalsIgnoreCase(typ)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(ERROR);
    }
}
