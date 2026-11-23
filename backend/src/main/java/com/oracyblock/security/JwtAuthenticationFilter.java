package com.oracyblock.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/** Authorization: Bearer 토큰을 읽어 로그인한 사람을 정해요. 컨트롤러에서는 @AuthenticationPrincipal Long userId */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwt;

    public JwtAuthenticationFilter(JwtTokenProvider jwt) {
        this.jwt = jwt;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {
        String h = req.getHeader("Authorization");
        if (h != null && h.startsWith("Bearer ")) {
            jwt.parse(h.substring(7)).ifPresent(u -> SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(u.userId(), null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + u.role())))));
        }
        chain.doFilter(req, res);
    }
}
