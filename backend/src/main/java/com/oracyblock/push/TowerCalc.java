package com.oracyblock.push;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * 내 탑 계산 (화면 없이). 웹 web/src/lib/speed.js(restEffect · tonight)와 lib/tower.js(buildTower)를 그대로 옮긴 것이에요.
 * 알림이 "오늘 밤 브릭이 떨어져요"라고 할 때 앱의 탑과 똑같아야 해서, TowerCalcTest가 웹에서 만든 답(rules-fixture.json)과 맞는지 확인해요
 */
public final class TowerCalc {
    private TowerCalc() {}

    /** speed.js SPEEDS와 같아야 해요: 하루 브릭 수(cap) · 며칠째 쉬면 금 · 한꺼번에 금 최대 · 금 간 뒤 며칠째 떨어짐 */
    public record Speed(int cap, int crackAfter, int maxCracks, int fallAfter) {}
    public static final Map<String, Speed> SPEEDS = Map.of(
            "slow", new Speed(1, 3, 1, 4), "normal", new Speed(2, 2, 2, 2), "fast", new Speed(3, 1, 2, 1));
    public static final int MAX_FALL = 5;

    public static Speed speedOf(String key) {
        return SPEEDS.getOrDefault(key == null ? "normal" : key, SPEEDS.get("normal"));
    }

    static String speedByCap(Integer cap) {
        if (cap == null) return null;
        for (Map.Entry<String, Speed> e : SPEEDS.entrySet()) if (e.getValue().cap() == cap) return e.getKey();
        return null;
    }

    /** 쉬는 날이 g일 이어졌을 때: 떨어진 브릭 수, 지금 금 간 브릭 수, 5개 넘게 떨어져 멈췄는지 */
    public record Rest(int fallen, int cracks, boolean capped) {}

    public static Rest restEffect(int g, Speed sp) {
        Deque<Integer> cracked = new ArrayDeque<>();
        int fallen = 0;
        for (int d = 1; d <= g; d++) {
            while (!cracked.isEmpty() && d - cracked.peekFirst() >= sp.fallAfter()) {
                cracked.pollFirst();
                fallen++;
            }
            if (fallen >= MAX_FALL) return new Rest(MAX_FALL, 0, true);
            if (d >= sp.crackAfter() && cracked.size() < sp.maxCracks()) cracked.addLast(d);
        }
        return new Rest(fallen, cracked.size(), false);
    }

    /** 쌓인 브릭 하나: 쌓은 날 · 그날의 하루 최대(쌓는 속도) */
    public record Brick(String day, Integer cap) {}

    /** 지금 탑: 남은 층 · 어제까지 통째로 쉰 날(오늘 공부했으면 -1) · 금 간 수 · 멈췄는지 */
    public record Now(int floors, int rest, int cracks, boolean capped) {}

    private static long dayNum(String d) {
        return LocalDate.parse(d).toEpochDay();
    }

    public static Now build(List<Brick> bricks, List<String> activeDays, LocalDate today, String nowSpeed, List<String> guardDays) {
        Map<String, List<Brick>> byDay = new HashMap<>();
        for (Brick b : bricks) byDay.computeIfAbsent(b.day(), k -> new ArrayList<>()).add(b);
        String todayS = today.toString();
        TreeSet<String> days = new TreeSet<>(activeDays);
        for (String g : guardDays) if (g.compareTo(todayS) < 0) days.add(g);
        int stack = 0;
        String prev = null;
        String thenSpeed = null;
        for (String d : days) {
            if (prev != null) stack = Math.max(0, stack - restEffect((int) (dayNum(d) - dayNum(prev) - 1), speedOf(thenSpeed != null ? thenSpeed : nowSpeed)).fallen());
            List<Brick> list = byDay.getOrDefault(d, List.of());
            stack += list.size();
            for (Brick b : list) {
                String s = speedByCap(b.cap());
                if (s != null) thenSpeed = s;
            }
            prev = d;
        }
        if (prev == null) return new Now(0, 0, 0, false);
        int rest = (int) (ChronoUnit.DAYS.between(LocalDate.parse(prev), today) - 1);
        Rest e = restEffect(rest, speedOf(nowSpeed));
        stack = Math.max(0, stack - e.fallen());
        return new Now(stack, rest, Math.min(e.cracks(), stack), e.capped());
    }

    /** 오늘 밤까지 공부하지 않으면: "fall"(n층 떨어짐) · "crack"(금이 감) · null (speed.js tonight와 같아요) */
    public static String tonight(int rest, Speed sp, int floors) {
        if (rest < 0 || floors <= 0) return null;
        Rest now = restEffect(rest, sp);
        Rest next = restEffect(rest + 1, sp);
        if (Math.min(next.fallen() - now.fallen(), floors) > 0) return "fall";
        if (next.cracks() > now.cracks()) return "crack";
        return null;
    }
}
