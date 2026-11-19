package com.oracyblock.visit;

import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** 사이트를 열 때마다 "오늘 왔어요" 한 줄 (관리자 통계의 방문자 수) */
@RestController
@RequestMapping("/api/v1")
public class VisitController {

    @Mapper
    public interface VisitMapper {
        @Insert("""
            INSERT INTO visit_day (visitor_id, day, user_id) VALUES (#{visitorId}, #{day}, #{userId})
            ON CONFLICT (visitor_id, day) DO UPDATE SET hits = visit_day.hits + 1,
              user_id = COALESCE(EXCLUDED.user_id, visit_day.user_id)
            """)
        void upsert(@Param("visitorId") String visitorId, @Param("day") LocalDate day, @Param("userId") Long userId);

        @Update("UPDATE users SET last_seen_at = now() WHERE id = #{id}")
        void touch(@Param("id") long id);
    }

    private final VisitMapper visits;

    public VisitController(VisitMapper visits) {
        this.visits = visits;
    }

    @PostMapping("/visit")
    public Map<String, Object> visit(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        Who who = Who.of(userId, req);
        if (!"unknown-visitor".equals(who.visitorId())) visits.upsert(who.visitorId(), Who.today(), userId);
        if (userId != null) visits.touch(userId);
        return Map.of("ok", true);
    }
}
