package com.oracyblock.shop;

import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/** 상점·미션 (로그인 없이도, 기록 주인 owner 기준) */
@RestController
@RequestMapping("/api/v1/shop")
public class ShopController {

    public record IdRequest(String id) {
    }

    public record RestRequest(String day) {
    }

    public record EquipRequest(String id, boolean on) {
    }

    private final ShopService shop;
    private final RateLimiter limiter;

    public ShopController(ShopService shop, RateLimiter limiter) {
        this.shop = shop;
        this.limiter = limiter;
    }

    private String owner(Long userId, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        String key = "shop:" + owner;
        limiter.check(key, 60, 60_000L, "조금 뒤에 다시 해 주세요.");
        limiter.record(key);
        return owner;
    }

    @GetMapping
    public Map<String, Object> state(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        shop.applyShields(owner);
        return shop.state(owner);
    }

    @PostMapping("/claim")
    public Map<String, Object> claim(@AuthenticationPrincipal Long userId, @RequestBody IdRequest body, HttpServletRequest req) {
        return shop.claim(owner(userId, req), body.id());
    }

    @PostMapping("/buy")
    public Map<String, Object> buy(@AuthenticationPrincipal Long userId, @RequestBody IdRequest body, HttpServletRequest req) {
        return shop.buy(owner(userId, req), body.id());
    }

    @PostMapping("/rest")
    public Map<String, Object> rest(@AuthenticationPrincipal Long userId, @RequestBody RestRequest body, HttpServletRequest req) {
        LocalDate day;
        try {
            day = LocalDate.parse(body.day());
        } catch (Exception e) {
            day = null;
        }
        return shop.useRest(owner(userId, req), day);
    }

    @PostMapping("/equip")
    public Map<String, Object> equip(@AuthenticationPrincipal Long userId, @RequestBody EquipRequest body, HttpServletRequest req) {
        return shop.equip(owner(userId, req), body.id(), body.on());
    }
}
