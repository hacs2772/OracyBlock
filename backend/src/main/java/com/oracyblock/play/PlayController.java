package com.oracyblock.play;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import com.oracyblock.pref.PrefController;
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
    private final PrefController.PrefMapper prefs;

    public PlayController(PlayMapper plays, PrefController.PrefMapper prefs) {
        this.plays = plays;
        this.prefs = prefs;
    }

    public record StartRequest(String talkId, Integer level) {
    }

    public record WordIn(String key, String ko, String mean, String say, boolean missed) {
    }

    public record FixIn(int turnIdx, String kind, String prev) {
    }

    /** 차례별 기록: i = 차례 번호, w = 튕긴 횟수, s = 두 번 튕겨 넘어감, h = 힌트, n = 어색한 대답 */
    public record TurnIn(int i, int w, int s, int h, int n) {
    }

    public record FinishRequest(boolean crooked, int bounces, int hints, int speakN, int writeN, int chooseN,
                                int okN, int nearN, int rescueN, String bricks, List<WordIn> words, List<FixIn> fixes,
                                List<TurnIn> turns) {
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

    public record TurnAt(int i) {}

    /** 대화 중 지금 몇 번째 차례인지 (끝내지 못한 대화가 어디서 멈췄는지 보려고, concept 11-25) */
    @PostMapping("/plays/{id}/at")
    public Map<String, Object> at(@AuthenticationPrincipal Long userId, @PathVariable long id, @RequestBody TurnAt body, HttpServletRequest req) {
        Who who = Who.of(userId, req);
        if (body != null) plays.reach(id, who.owner(), Math.max(0, Math.min(60, body.i())));
        return Map.of("ok", true);
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
        String owner = who.owner();
        plays.finish(id, today, PrefController.DAY_CAP.get(PrefController.speedOf(prefs, owner)), body);
        if (body.fixes() != null) {
            body.fixes().stream().limit(40)
                    .filter(f -> "hole".equals(f.kind()) || "tilt".equals(f.kind()) || "skip".equals(f.kind()))
                    .forEach(f -> plays.insertFix(owner, id, Math.max(0, Math.min(60, f.turnIdx())), f.kind(), cut(f.prev(), 200)));
        }
        if (body.turns() != null) {
            String talkId = String.valueOf(row.get("talkId"));
            body.turns().stream().limit(60).filter(t -> t.i() >= 0 && t.i() <= 60)
                    .forEach(t -> plays.insertTurn(id, talkId, t.i(), Math.max(0, Math.min(9, t.w())), t.s() > 0, t.h() > 0, t.n() > 0));
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
        LocalDate today = Who.today();
        Map<String, Object> counts = plays.wordCounts(owner, today);
        String speed = PrefController.speedOf(prefs, owner);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("speed", speed);
        m.put("dayCap", PrefController.DAY_CAP.get(speed));
        m.put("finishedToday", plays.finishedOn(owner, today));
        m.put("answersToday", plays.answersOn(owner, today));
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
