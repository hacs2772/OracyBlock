package com.oracyblock.tower;

import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/** 내 탑(대화 하나 = 브릭 1개, 하루 최대 3개)과 순위(브릭 개수) */
@RestController
@RequestMapping("/api/v1")
public class TowerController {

    private final TowerMapper tower;

    public TowerController(TowerMapper tower) {
        this.tower = tower;
    }

    @GetMapping("/tower")
    public Map<String, Object> tower(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        List<Map<String, Object>> bricks = tower.bricks(Who.of(userId, req).owner());
        String today = Who.today().toString();
        Set<Object> days = new HashSet<>();
        int todayCount = 0;
        for (Map<String, Object> b : bricks) {
            days.add(b.get("day"));
            if (today.equals(b.get("day"))) todayCount++;
        }
        return Map.of("bricks", bricks, "days", days.size(), "today", todayCount);
    }

    @GetMapping("/ranking")
    public Map<String, Object> ranking(@AuthenticationPrincipal Long userId, @RequestParam(defaultValue = "week") String scope) {
        LocalDate since = "all".equals(scope) ? LocalDate.of(2000, 1, 1)
                : Who.today().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Map<String, Object>> all = tower.ranking(since);
        List<Map<String, Object>> rows = new ArrayList<>();
        Map<String, Object> mine = null;
        for (Map<String, Object> r : all) {
            boolean me = userId != null && userId.equals(((Number) r.get("userId")).longValue());
            Map<String, Object> row = Map.of("rank", r.get("rank"), "nickname", r.get("nickname"), "bricks", r.get("bricks"), "me", me);
            if (rows.size() < 50) rows.add(row);
            if (me) mine = row;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rows", rows);
        out.put("mine", mine);
        return out;
    }
}
