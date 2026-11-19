package com.oracyblock.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties("app")
public record AppProperties(Jwt jwt, Admin admin) {
    public record Jwt(String secret, Duration validity) {
    }

    public record Admin(String email, String password, String nickname) {
    }
}
