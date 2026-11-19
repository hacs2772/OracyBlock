package com.oracyblock.common;

import jakarta.servlet.http.HttpServletRequest;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.regex.Pattern;

/** 지금 요청한 사람: 로그인했으면 userId, 아니면 기기의 방문자 번호로 기록 주인(owner)을 정해요 */
public record Who(Long userId, String visitorId) {

    public static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final Pattern VISITOR = Pattern.compile("[A-Za-z0-9-]{8,64}");

    public static Who of(Long userId, HttpServletRequest req) {
        String v = req.getHeader("X-Visitor-Id");
        if (v == null || !VISITOR.matcher(v).matches()) v = "unknown-visitor";
        return new Who(userId, v);
    }

    public String owner() {
        return userId != null ? "u:" + userId : "v:" + visitorId;
    }

    public static LocalDate today() {
        return LocalDate.now(KST);
    }

    public static String clientIp(HttpServletRequest req) {
        String cf = req.getHeader("CF-Connecting-IP");
        if (cf != null && !cf.isBlank()) return cf.trim();
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        return req.getRemoteAddr();
    }
}
