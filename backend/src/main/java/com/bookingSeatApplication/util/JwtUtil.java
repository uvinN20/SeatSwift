package com.bookingSeatApplication.util;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

@Component
public class JwtUtil {

    private static final String ROLE_CLAIM = "role";

    private final Key signKey;

    public JwtUtil(@Value("${app.jwt.secret}") String secret) {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("app.jwt.secret (JWT_SECRET) must be at least 32 bytes");
        }
        this.signKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** Role is embedded so the filter knows which user table to resolve the subject against. */
    public String generateToken(String subject, String role) {
        try {
            return Jwts.builder()
                    .setSubject(subject)
                    .claim(ROLE_CLAIM, role)
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + 1000L * 60 * 60)) // 1 hour
                    .signWith(signKey, SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            throw new RuntimeException("Error generating Jwt token", e);
        }
    }

    private Claims parse(String token) {
        return Jwts.parserBuilder().setSigningKey(signKey).build().parseClaimsJws(token).getBody();
    }

    public String extractUsername(String token) {
        return parse(token).getSubject();
    }

    public String extractRole(String token) {
        return parse(token).get(ROLE_CLAIM, String.class);
    }

    public boolean validateToken(String token) {
        try {
            parse(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
