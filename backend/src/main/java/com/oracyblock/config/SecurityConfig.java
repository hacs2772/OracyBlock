package com.oracyblock.config;

import com.oracyblock.security.JwtAuthenticationFilter;
import com.oracyblock.security.JwtTokenProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.nio.charset.StandardCharsets;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtTokenProvider jwt) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e
                .authenticationEntryPoint((req, res, ex) -> write(res, HttpStatus.UNAUTHORIZED, "로그인이 필요해요."))
                .accessDeniedHandler((req, res, ex) -> write(res, HttpStatus.FORBIDDEN, "관리자만 볼 수 있어요.")))
            .authorizeHttpRequests(a -> a
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN")
                .requestMatchers("/api/v1/me", "/api/v1/ranking").authenticated()
                .anyRequest().permitAll())
            .addFilterBefore(new JwtAuthenticationFilter(jwt), UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    private static void write(jakarta.servlet.http.HttpServletResponse res, HttpStatus status, String msg) throws java.io.IOException {
        res.setStatus(status.value());
        res.setContentType("application/json;charset=UTF-8");
        res.getOutputStream().write(("{\"message\":\"" + msg + "\"}").getBytes(StandardCharsets.UTF_8));
    }
}
