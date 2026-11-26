package com.oracyblock.common;

import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 같은 곳에서 너무 자주 하면 잠깐 막아요 (비밀번호 마구 넣어 보기, 가입 도배 막기). 서버를 다시 켜면 지워져요 */
@Component
public class RateLimiter {
    /** 쓰는 창 중 가장 긴 것 (가입 1시간) */
    static final long MAX_WINDOW = 3_600_000L;
    private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();

    public void check(String key, int max, long windowMillis, String message) {
        if (count(key, windowMillis) >= max) throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, message);
    }

    /** 막지 않고 되는지만 알려 줘요 (조용히 버릴 때) */
    public boolean allow(String key, int max, long windowMillis) {
        return count(key, windowMillis) < max;
    }

    public void record(String key) {
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            q.addLast(System.currentTimeMillis());
        }
    }

    /** 10분마다: 가장 긴 창(1시간)보다 오래된 기록만 남은 곳은 지워요 (메모리가 계속 늘지 않게) */
    @Scheduled(fixedDelay = 600_000L)
    public void sweep() {
        long old = System.currentTimeMillis() - MAX_WINDOW;
        hits.entrySet().removeIf(e -> {
            Deque<Long> q = e.getValue();
            synchronized (q) {
                Long last = q.peekLast();
                return last == null || last < old;
            }
        });
    }

    /** 지금 기억하는 곳 수 (시험용) */
    int size() {
        return hits.size();
    }

    public void clear(String key) {
        hits.remove(key);
    }

    private int count(String key, long windowMillis) {
        Deque<Long> q = hits.get(key);
        if (q == null) return 0;
        long since = System.currentTimeMillis() - windowMillis;
        synchronized (q) {
            while (!q.isEmpty() && q.peekFirst() < since) q.pollFirst();
            return q.size();
        }
    }
}
