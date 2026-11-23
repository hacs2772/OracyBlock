package com.oracyblock.push;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.*;

/** 휴대폰 알림 켜기·끄기·시간 (concept 11-32). 로그인 없이도 (둘러보기 기기도) */
@RestController
@RequestMapping("/api/v1/push")
@EnableScheduling
public class PushController {
    /** 브라우저 회사의 알림 서버로만 보내요 (아무 주소로나 보내지 않게) */
    private static final List<String> HOSTS = List.of(".googleapis.com", ".mozilla.com", ".push.apple.com", ".notify.windows.com", ".mozaws.net");
    private static final Set<String> KINDS = Set.of("day", "crack", "meet");

    public record Keys(String p256dh, String auth) {}
    public record SubIn(String endpoint, Keys keys, Integer hour, List<String> kinds) {}
    public record EndIn(String endpoint) {}

    private final PushMapper push;
    private final PushService service;
    private final RateLimiter limiter;

    public PushController(PushMapper push, PushService service, RateLimiter limiter) {
        this.push = push;
        this.service = service;
        this.limiter = limiter;
    }

    @GetMapping("/key")
    public Map<String, Object> key() {
        return Map.of("key", service.publicKey());
    }

    private static String endpoint(String e) {
        try {
            URI u = URI.create(e == null ? "" : e);
            String h = u.getHost() == null ? "" : u.getHost().toLowerCase();
            if ("https".equals(u.getScheme()) && HOSTS.stream().anyMatch(h::endsWith) && e.length() < 1000) return e;
        } catch (Exception ignore) {
            // 아래에서 막아요
        }
        throw new ApiException(HttpStatus.BAD_REQUEST, "이 브라우저의 알림 주소를 쓸 수 없어요.");
    }

    private static int hour(Integer h) {
        return h == null ? 21 : Math.max(6, Math.min(23, h));
    }

    private static String kinds(List<String> ks) {
        if (ks == null) return "day,crack,meet";
        List<String> ok = ks.stream().filter(KINDS::contains).distinct().sorted().toList();
        return String.join(",", ok);
    }

    /** 알림 켜기 (같은 기기면 바꾸기). 켜자마자 시험 알림 하나 */
    @PostMapping("/sub")
    public Map<String, Object> sub(@AuthenticationPrincipal Long userId, @RequestBody SubIn body, HttpServletRequest req) {
        String key = "push:" + Who.clientIp(req);
        limiter.check(key, 20, 600_000L, "조금 뒤에 다시 해 주세요.");
        limiter.record(key);
        if (body == null || body.keys() == null || body.keys().p256dh() == null || body.keys().auth() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "알림 정보가 비었어요.");
        String ep = endpoint(body.endpoint());
        String owner = Who.of(userId, req).owner();
        push.upsert(owner, ep, body.keys().p256dh(), body.keys().auth(), hour(body.hour()), kinds(body.kinds()));
        boolean tested = true;
        try {
            service.sendTest(Map.of("endpoint", ep, "p256dh", body.keys().p256dh(), "auth", body.keys().auth()));
        } catch (Exception e) {
            tested = false;
        }
        return Map.of("ok", true, "tested", tested);
    }

    @PutMapping("/sub")
    public Map<String, Object> pref(@AuthenticationPrincipal Long userId, @RequestBody SubIn body, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        return Map.of("ok", push.pref(owner, endpoint(body.endpoint()), hour(body.hour()), kinds(body.kinds())) > 0);
    }

    @PostMapping("/off")
    public Map<String, Object> off(@AuthenticationPrincipal Long userId, @RequestBody EndIn body, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        return Map.of("ok", push.remove(owner, endpoint(body.endpoint())) > 0);
    }

    /** 이 기기의 지금 설정 (내 정보 화면) */
    @PostMapping("/mine")
    public Map<String, Object> mine(@AuthenticationPrincipal Long userId, @RequestBody EndIn body, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        Map<String, Object> m = push.mine(owner, endpoint(body.endpoint()));
        return m == null ? Map.of("on", false) : Map.of("on", true, "hour", m.get("hour"), "kinds", String.valueOf(m.get("kinds")).split(","));
    }
}
