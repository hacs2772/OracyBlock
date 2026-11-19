package com.oracyblock.feedback;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/** 의견 보내기 (로그인 없이도, 10분에 5번까지) */
@RestController
@RequestMapping("/api/v1")
public class FeedbackController {

    @Mapper
    public interface FeedbackMapper {
        @Insert("INSERT INTO feedback (user_id, visitor_id, message, page) VALUES (#{userId}, #{visitorId}, #{message}, #{page})")
        void insert(@Param("userId") Long userId, @Param("visitorId") String visitorId, @Param("message") String message, @Param("page") String page);
    }

    public record FeedbackRequest(String message, String page) {
    }

    private final FeedbackMapper mapper;
    private final RateLimiter limiter;

    public FeedbackController(FeedbackMapper mapper, RateLimiter limiter) {
        this.mapper = mapper;
        this.limiter = limiter;
    }

    @PostMapping("/feedback")
    public Map<String, Object> send(@AuthenticationPrincipal Long userId, @RequestBody FeedbackRequest body, HttpServletRequest req) {
        String m = body.message() == null ? "" : body.message().strip();
        if (m.length() < 2 || m.length() > 2000) throw new ApiException(HttpStatus.BAD_REQUEST, "의견은 2~2000자로 적어 주세요.");
        String key = "fb:" + Who.clientIp(req);
        limiter.check(key, 5, 600_000L, "조금 뒤에 다시 보내 주세요.");
        limiter.record(key);
        String page = body.page() == null ? null : body.page().substring(0, Math.min(40, body.page().length()));
        mapper.insert(userId, Who.of(userId, req).visitorId(), m, page);
        return Map.of("ok", true);
    }
}
