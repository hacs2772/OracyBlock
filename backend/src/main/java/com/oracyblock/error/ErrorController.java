package com.oracyblock.error;

import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

/** 화면 오류 모으기 (concept 11-26): 사용자 화면에서 오류가 나면 저절로 보내고, 관리자 화면에서 봐요 */
@RestController
@RequestMapping("/api/v1")
public class ErrorController {

    @Mapper
    public interface ErrorMapper {
        @Insert("""
            INSERT INTO client_error (day, page, message, kind, stack, ua, build, visitor_id)
            VALUES (#{day}, #{page}, #{message}, #{kind}, #{stack}, #{ua}, #{build}, #{visitorId})
            ON CONFLICT (day, page, message) DO UPDATE SET n = client_error.n + 1, last_at = now(), is_done = false,
              stack = COALESCE(EXCLUDED.stack, client_error.stack), ua = EXCLUDED.ua, build = EXCLUDED.build
            """)
        void upsert(@Param("day") LocalDate day, @Param("page") String page, @Param("message") String message, @Param("kind") String kind,
                    @Param("stack") String stack, @Param("ua") String ua, @Param("build") String build, @Param("visitorId") String visitorId);

        /** 처리 안 한 오류: 최근 14일, 같은 오류는 날짜를 넘어 묶어서 (관리자 기기 뺌) */
        @Select("""
            SELECT MAX(id) AS id, message, page, MAX(kind) AS kind, SUM(n) AS n, COUNT(DISTINCT visitor_id) AS people,
                   to_char(MAX(last_at) AT TIME ZONE 'Asia/Seoul', 'MM-DD HH24:MI') AS last,
                   (ARRAY_AGG(stack ORDER BY last_at DESC))[1] AS stack, (ARRAY_AGG(ua ORDER BY last_at DESC))[1] AS ua,
                   (ARRAY_AGG(build ORDER BY last_at DESC))[1] AS build
            FROM client_error
            WHERE NOT is_done AND day > (now() AT TIME ZONE 'Asia/Seoul')::date - 14
              AND (visitor_id IS NULL OR visitor_id NOT IN (SELECT visitor_id FROM admin_visitor))
            GROUP BY message, page ORDER BY MAX(last_at) DESC LIMIT 100
            """)
        List<Map<String, Object>> open();

        @Update("UPDATE client_error SET is_done = true WHERE message = #{message} AND page = #{page} AND NOT is_done")
        int done(@Param("message") String message, @Param("page") String page);

        @Select("""
            SELECT COUNT(DISTINCT (message, page)) FROM client_error
            WHERE NOT is_done AND day > (now() AT TIME ZONE 'Asia/Seoul')::date - 14
              AND (visitor_id IS NULL OR visitor_id NOT IN (SELECT visitor_id FROM admin_visitor))
            """)
        long openCount();
    }

    public record ErrorIn(String message, String stack, String page, String kind, String build) {}
    public record DoneIn(String message, String page) {}

    private static final Set<String> KINDS = Set.of("crash", "error", "promise");
    private final ErrorMapper mapper;
    private final RateLimiter limiter;

    public ErrorController(ErrorMapper mapper, RateLimiter limiter) {
        this.mapper = mapper;
        this.limiter = limiter;
    }

    private static String cut(String s, int n) {
        if (s == null) return null;
        s = s.strip();
        return s.isEmpty() ? null : s.substring(0, Math.min(n, s.length()));
    }

    /** 기기마다 10분에 30번까지. 넘치면 조용히 버려요 (오류 보고가 또 오류를 만들지 않게) */
    @PostMapping("/errors")
    public Map<String, Object> report(@AuthenticationPrincipal Long userId, @RequestBody ErrorIn body, HttpServletRequest req) {
        String message = cut(body == null ? null : body.message(), 300);
        if (message == null) return Map.of("ok", false);
        String key = "err:" + Who.clientIp(req);
        if (!limiter.allow(key, 30, 600_000L)) return Map.of("ok", false);
        limiter.record(key);
        Who who = Who.of(userId, req);
        String page = cut(body.page(), 120);
        if (page == null) page = "/";
        page = page.replaceAll("[?#].*$", "");
        mapper.upsert(Who.today(), page, message, KINDS.contains(body.kind()) ? body.kind() : "error",
                cut(body.stack(), 4000), cut(req.getHeader("User-Agent"), 300), cut(body.build(), 40), who.visitorId());
        return Map.of("ok", true);
    }

    @GetMapping("/admin/errors")
    public List<Map<String, Object>> open() {
        return mapper.open();
    }

    @PutMapping("/admin/errors/done")
    public Map<String, Object> done(@RequestBody DoneIn body) {
        return Map.of("done", mapper.done(body.message(), body.page()));
    }
}
