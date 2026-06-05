package com.example.backend.controller;

import java.util.List;
import java.util.Map;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public Map<String, Object> hello(Authentication authentication, @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwt.getSubject();
        }

        List<String> authorities = authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .toList();

        return Map.of(
            "message", "Hello, " + username + "!",
            "subject", jwt.getSubject(),
            "issuer", jwt.getIssuer().toString(),
            "audience", jwt.getAudience(),
            "expiresAt", jwt.getExpiresAt(),
            "tokenType", jwt.getClaimAsString("typ"),
            "authorities", authorities
        );
    }
}
