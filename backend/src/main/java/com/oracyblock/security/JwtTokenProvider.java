package com.oracyblock.security;

import com.oracyblock.config.AppProperties;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Optional;

/** 로그인 토큰(JWT) 만들기·확인하기 */
@Component
public class JwtTokenProvider {

    private final SecretKey key;
    private final long validityMillis;

    public JwtTokenProvider(AppProperties props) {
        String secret = props.jwt().secret();
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET 이 비어 있거나 32자보다 짧아요. .env 를 확인해 주세요.");
        }
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.validityMillis = props.jwt().validity().toMillis();
    }

    public String create(long userId, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + validityMillis))
                .signWith(key)
                .compact();
    }

    public Optional<AuthUser> parse(String token) {
        try {
            Claims c = Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
            return Optional.of(new AuthUser(Long.parseLong(c.getSubject()), c.get("role", String.class)));
        } catch (JwtException | IllegalArgumentException e) {
            return Optional.empty();
        }
    }

    public record AuthUser(long userId, String role) {
    }
}
