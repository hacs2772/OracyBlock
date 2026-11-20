package com.oracyblock.review;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;

/** 고치기 탭: 단어 복습(간격 반복) + 고칠 곳 다시 만들기 */
@RestController
@RequestMapping("/api/v1")
public class ReviewController {

    /** stage 0~4 → 다음 복습까지 1·3·7·14·30일 */
    static final int[] DAYS = {1, 3, 7, 14, 30};

    private final ReviewMapper review;

    public ReviewController(ReviewMapper review) {
        this.review = review;
    }

    public record WordResult(String key, boolean ok) {
    }

    public record FixRequest(String how, String bricks) {
    }

    @GetMapping("/words")
    public List<Map<String, Object>> words(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        return review.words(Who.of(userId, req).owner());
    }

    @PostMapping("/words/result")
    @Transactional
    public Map<String, Object> wordResult(@AuthenticationPrincipal Long userId, @RequestBody WordResult body, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        Integer stage = review.stageOf(owner, body.key());
        if (stage == null) throw new ApiException(HttpStatus.NOT_FOUND, "단어를 찾지 못했어요.");
        int next = body.ok() ? Math.min(DAYS.length - 1, stage + 1) : 0;
        LocalDate due = Who.today().plusDays(body.ok() ? DAYS[next] : 1);
        review.schedule(owner, body.key(), next, due, body.ok() ? 0 : 1);
        review.answer(owner, body.key(), body.ok(), Who.today());
        return Map.of("stage", next, "dueDay", due.toString());
    }

    @GetMapping("/review-tower")
    public Map<String, Object> reviewTower(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        List<Map<String, Object>> recent = new ArrayList<>(review.towerBricks(owner));
        Collections.reverse(recent);
        return Map.of("bricks", recent, "total", review.towerTotal(owner));
    }

    /** 고칠 곳을 대화(구조물)마다 묶어서 */
    @GetMapping("/fixes")
    public List<Map<String, Object>> fixes(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        Map<Object, Map<String, Object>> groups = new LinkedHashMap<>();
        for (Map<String, Object> r : review.openFixes(Who.of(userId, req).owner())) {
            Map<String, Object> g = groups.computeIfAbsent(r.get("playId"), k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("playId", r.get("playId"));
                m.put("talkId", r.get("talkId"));
                m.put("level", r.get("level"));
                m.put("bricks", r.get("bricks"));
                m.put("finishedAt", r.get("finishedAt"));
                m.put("items", new ArrayList<Map<String, Object>>());
                return m;
            });
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> items = (List<Map<String, Object>>) g.get("items");
            items.add(Map.of("id", r.get("id"), "turnIdx", r.get("turnIdx"), "kind", r.get("kind"), "prev", r.get("prev")));
        }
        return new ArrayList<>(groups.values());
    }

    @PostMapping("/fixes/{id}")
    @Transactional
    public Map<String, Object> fix(@AuthenticationPrincipal Long userId, @PathVariable long id, @RequestBody FixRequest body, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        Long playId = review.openFixPlay(id, owner);
        if (playId == null) throw new ApiException(HttpStatus.NOT_FOUND, "이미 고쳤거나 찾지 못했어요.");
        String how = Set.of("hear", "speak", "write", "choose").contains(body.how()) ? body.how() : "choose";
        review.markFixed(id, how);
        if (body.bricks() != null && body.bricks().length() <= 6000 && body.bricks().startsWith("[")) {
            review.updateBricks(playId, body.bricks());
        }
        return Map.of("ok", true);
    }
}
