package com.oracyblock.common;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * 저장하는 요청(POST·PUT·DELETE)은 한 곳(IP)에서 10분에 600번까지 (스크립트로 기록을 마구 쌓지 못하게).
 * 열심히 하는 사람도 10분에 150번 안팎이라 평소에는 걸리지 않아요. 가입·로그인 등은 따로 더 촘촘히 막아요
 */
@Component
public class WriteLimitFilter extends OncePerRequestFilter {
    static final int MAX = 600;
    static final long WINDOW = 600_000L;

    private final RateLimiter limiter;

    public WriteLimitFilter(RateLimiter limiter) {
        this.limiter = limiter;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest req) {
        String m = req.getMethod();
        return !req.getRequestURI().startsWith("/api/") || "GET".equals(m) || "HEAD".equals(m) || "OPTIONS".equals(m);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) throws ServletException, IOException {
        String key = "write:" + Who.clientIp(req);
        if (!limiter.allow(key, MAX, WINDOW)) {
            res.setStatus(429);
            res.setContentType("application/json;charset=UTF-8");
            res.getWriter().write("{\"message\":\"요청이 너무 많아요. 잠시 뒤에 다시 해 주세요.\"}");
            return;
        }
        limiter.record(key);
        chain.doFilter(req, res);
    }
}
