package com.oracyblock.report;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

/** 대사 신고 "이 문장 이상해요" (로그인 없이도, 10분에 20번까지) + 관리자 목록 */
@RestController
@RequestMapping("/api/v1")
public class ReportController {

    @Mapper
    public interface ReportMapper {
        @Insert("""
            INSERT INTO line_report (owner, talk_id, turn_idx, reason, note, line_text)
            VALUES (#{owner}, #{talkId}, #{turnIdx}, #{reason}, #{note}, #{line})
            """)
        void insert(@Param("owner") String owner, @Param("talkId") String talkId, @Param("turnIdx") int turnIdx,
                    @Param("reason") String reason, @Param("note") String note, @Param("line") String line);

        /** 처리 안 한 신고를 대사마다 묶어서, 많이 신고된 순서로 */
        @Select("""
            SELECT talk_id AS "talkId", turn_idx AS "turnIdx", COUNT(*) AS n,
                   COUNT(DISTINCT owner) AS people,
                   MAX(line_text) AS line,
                   string_agg(DISTINCT reason, ',') AS reasons,
                   string_agg(note, ' | ' ORDER BY created_at DESC) FILTER (WHERE note IS NOT NULL AND note <> '') AS notes,
                   to_char(MAX(created_at) AT TIME ZONE 'Asia/Seoul', 'MM-DD HH24:MI') AS last
            FROM line_report WHERE NOT is_done
            GROUP BY talk_id, turn_idx ORDER BY COUNT(DISTINCT owner) DESC, MAX(created_at) DESC LIMIT 200
            """)
        List<Map<String, Object>> open();

        @Update("UPDATE line_report SET is_done = true WHERE talk_id = #{talkId} AND turn_idx = #{turnIdx} AND NOT is_done")
        int done(@Param("talkId") String talkId, @Param("turnIdx") int turnIdx);

        @Select("SELECT COUNT(DISTINCT (talk_id, turn_idx)) FROM line_report WHERE NOT is_done")
        long openCount();
    }

    /** reason: ja 일본어가 어색해요 · ko 한글 발음이 이상해요 · mean 뜻이 틀려요 · answer 대답이 이상해요 · etc 기타 */
    public record ReportRequest(String talkId, Integer turnIdx, String reason, String note, String line) {
    }

    public record DoneRequest(String talkId, Integer turnIdx) {
    }

    private static final Set<String> REASONS = Set.of("ja", "ko", "mean", "answer", "etc");
    private final ReportMapper mapper;
    private final RateLimiter limiter;

    public ReportController(ReportMapper mapper, RateLimiter limiter) {
        this.mapper = mapper;
        this.limiter = limiter;
    }

    private static String cut(String s, int n) {
        if (s == null) return null;
        s = s.strip();
        return s.isEmpty() ? null : s.substring(0, Math.min(n, s.length()));
    }

    @PostMapping("/line-report")
    public Map<String, Object> report(@AuthenticationPrincipal Long userId, @RequestBody ReportRequest body, HttpServletRequest req) {
        if (body.talkId() == null || !body.talkId().matches("[a-z0-9_-]{1,40}") || body.turnIdx() == null || body.turnIdx() < 0 || body.turnIdx() > 60
                || !REASONS.contains(body.reason())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "신고 내용을 다시 확인해 주세요.");
        }
        String key = "lr:" + Who.clientIp(req);
        limiter.check(key, 20, 600_000L, "조금 뒤에 다시 보내 주세요.");
        limiter.record(key);
        mapper.insert(Who.of(userId, req).owner(), body.talkId(), body.turnIdx(), body.reason(), cut(body.note(), 500), cut(body.line(), 300));
        return Map.of("ok", true);
    }

    @GetMapping("/admin/line-reports")
    public List<Map<String, Object>> open() {
        return mapper.open();
    }

    /** 대사를 고쳤으면 그 대사의 신고를 한 번에 처리 완료 */
    @PutMapping("/admin/line-reports/done")
    public Map<String, Object> done(@RequestBody DoneRequest body) {
        if (body.talkId() == null || body.turnIdx() == null) throw new ApiException(HttpStatus.BAD_REQUEST, "대사를 골라 주세요.");
        return Map.of("ok", true, "n", mapper.done(body.talkId(), body.turnIdx()));
    }
}
