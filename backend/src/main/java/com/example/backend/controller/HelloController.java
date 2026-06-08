package com.example.backend.controller;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Stream;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class HelloController {

    @GetMapping("/hello")
    public Map<String, Object> hello(Authentication authentication) {
        Jwt jwt = (Jwt) authentication.getPrincipal();
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null || username.isBlank()) {
            username = jwt.getSubject();
        }
        String email = jwt.getClaimAsString("email");

        List<String> authorities = authentication.getAuthorities()
            .stream()
            .map(GrantedAuthority::getAuthority)
            .toList();
        List<String> roles = authorities.stream()
            .filter(authority -> authority.startsWith("ROLE_"))
            .toList();
        String scopeClaim = jwt.getClaimAsString("scope");
        Stream<String> claimScopes = scopeClaim == null
            ? Stream.empty()
            : Stream.of(scopeClaim.split("\\s+")).filter(scope -> !scope.isBlank());

        List<String> scopes = Stream.concat(
                authorities.stream()
                    .filter(authority -> authority.startsWith("SCOPE_"))
                    .map(authority -> authority.substring("SCOPE_".length())),
                claimScopes
            )
            .distinct()
            .toList();

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Hello, " + username + "!");
        response.put("subject", jwt.getSubject());
        response.put("preferredUsername", jwt.getClaimAsString("preferred_username"));
        response.put("email", email);
        response.put("issuer", jwt.getIssuer() != null ? jwt.getIssuer().toString() : null);
        response.put("audience", jwt.getAudience());
        response.put("expiresAt", jwt.getExpiresAt());
        response.put("tokenType", jwt.getClaimAsString("typ"));
        response.put("roles", roles);
        response.put("scopes", scopes);
        response.put("authorities", authorities);
        return response;
    }
}
