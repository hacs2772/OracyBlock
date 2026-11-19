package com.oracyblock.play;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 대화 시작·끝 기록, 여행 판에 쓰는 내 기록 */
@RestController
@RequestMapping("/api/v1")
public class PlayController {

    private final PlayMapper plays;

    public PlayController(PlayMapper plays) {
        this.plays = plays;
    }

    public record StartRequest(String talkId, Integer level) {
    }

    public record WordIn(String key, String ko, String mean, String say, boolean missed) {
    }

    public record FixIn(int turnIdx, String kind, String prev) {
    }

    public record FinishRequest(boolean crooked, int bounces, int hints, int speakN, int writeN, int chooseN,
                                int okN, int nearN, int rescueN, String bricks, List<WordIn> words, List<FixIn> fixes) {
    }

    @PostMapping("/plays")
    public Map<String, Object> start(@AuthenticationPrincipal Long userId, @RequestBody StartRequest body, HttpServletRequest req) {
        if (body.talkId() == null || !body.talkId().matches("[a-z0-9-]{1,40}")) throw new ApiException(HttpStatus.BAD_REQUEST, "대화를 찾지 못했어요.");
        int level = body.level() == null ? 1 : Math.max(1, Math.min(5, body.level()));
        Who who = Who.of(userId, req);
        PlayMapper.NewPlay p = new PlayMapper.NewPlay(who.owner(), userId, who.visitorId(), body.talkId(), level);
        plays.insert(p);
        return Map.of("id", p.id);
    }

    @PostMapping("/plays/{id}/finish")
    @Transactional
    public Map<String, Object> finish(@AuthenticationPrincipal Long userId, @PathVariable long id,
                                      @RequestBody FinishRequest body, HttpServletRequest req) {
        Who who = Who.of(userId, req);
        Map<String, Object> row = plays.ownerOf(id);
        if (row == null || !who.owner().equals(row.get("owner"))) throw new ApiException(HttpStatus.NOT_FOUND, "대화 기록을 찾지 못했어요.");
        if (Boolean.TRUE.equals(row.get("finished"))) return Map.of("ok", true);
        if (body.bricks() != null && body.bricks().length() > 6000) throw new ApiException(HttpStatus.BAD_REQUEST, "기록이 너무 길어요.");
        LocalDate today = Who.today();
        plays.finish(id, today, body);
        String owner = who.owner();
        if (body.fixes() != null) {
            body.fixes().stream().limit(40)
                    .filter(f -> "hole".equals(f.kind()) || "tilt".equals(f.kind()))
                    .forEach(f -> plays.insertFix(owner, id, Math.max(0, Math.min(60, f.turnIdx())), f.kind(), cut(f.prev(), 200)));
        }
        if (body.words() != null) {
            for (WordIn w : body.words().stream().limit(60).toList()) {
                if (w.key() == null || w.key().isBlank()) continue;
                WordIn clean = new WordIn(cut(w.key(), 80), cut(w.ko(), 80), cut(w.mean(), 120), cut(w.say(), 80), w.missed());
                // 놓친 단어는 내일, 알아들은 단어는 3일 뒤 복습
                plays.upsertWord(owner, clean, w.missed() ? 0 : 1, today.plusDays(w.missed() ? 1 : 3), w.missed() ? 1 : 0);
            }
        }
        return Map.of("ok", true);
    }

    @GetMapping("/progress")
    public Map<String, Object> progress(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        String owner = Who.of(userId, req).owner();
        Map<String, Object> counts = plays.wordCounts(owner, Who.today());
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("plays", plays.finished(owner));
        m.put("fixesOpen", plays.openFixes(owner));
        m.put("wordsDue", counts.get("due"));
        m.put("wordsTotal", counts.get("total"));
        return m;
    }

    static String cut(String s, int max) {
        if (s == null) return "";
        return s.length() > max ? s.substring(0, max) : s;
    }
}
