package com.oracyblock.tower;

import com.oracyblock.common.Who;
import com.oracyblock.shop.ShopService;
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
    private final ShopService shop;

    public TowerController(TowerMapper tower, ShopService shop) {
        this.tower = tower;
        this.shop = shop;
    }

    @GetMapping("/tower")
    public Map<String, Object> tower(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        shop.applyShields(owner); // 방어권이 있으면 금 가는 날을 먼저 지켜요
        List<Map<String, Object>> bricks = tower.bricks(owner);
        String today = Who.today().toString();
        int todayCount = 0;
        for (Map<String, Object> b : bricks) if (today.equals(b.get("day"))) todayCount++;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("bricks", bricks);
        m.put("activeDays", tower.activeDays(owner));
        m.put("todayDate", today);
        m.put("today", todayCount);
        m.putAll(shop.towerExtras(owner)); // guardDays · looks · shields
        return m;
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
            Map<String, Object> row = Map.of("rank", r.get("rank"), "nickname", r.get("nickname"), "days", r.get("days"), "me", me);
            if (rows.size() < 50) rows.add(row);
            if (me) mine = row;
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("rows", rows);
        out.put("mine", mine);
        return out;
    }
}
