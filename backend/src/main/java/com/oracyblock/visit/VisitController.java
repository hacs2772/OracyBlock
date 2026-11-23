package com.oracyblock.visit;

import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

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

        @Insert("INSERT INTO visit_step (visitor_id, step) VALUES (#{visitorId}, #{step}) ON CONFLICT DO NOTHING")
        void step(@Param("visitorId") String visitorId, @Param("step") String step);

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

    static final Set<String> STEPS = Set.of("about", "cta", "guide", "sound");
    public record StepIn(String step) {}

    /** 처음 온 사람이 지나간 단계 (concept 11-25). 정해진 이름만, 기기마다 한 번 */
    @PostMapping("/visit/step")
    public Map<String, Object> step(@AuthenticationPrincipal Long userId, @RequestBody StepIn body, HttpServletRequest req) {
        Who who = Who.of(userId, req);
        if (body != null && STEPS.contains(body.step()) && !"unknown-visitor".equals(who.visitorId())) visits.step(who.visitorId(), body.step());
        return Map.of("ok", true);
    }
}
