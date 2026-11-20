package com.oracyblock.pref;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import jakarta.servlet.http.HttpServletRequest;
import org.apache.ibatis.annotations.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/** 쌓는 속도: 처음 한 번은 자유롭게, 그다음부터는 3일에 한 번 바꿀 수 있어요 */
@RestController
@RequestMapping("/api/v1/pref")
public class PrefController {

    /** 하루 최대 브릭 (web/src/lib/speed.js 와 같게) */
    public static final Map<String, Integer> DAY_CAP = Map.of("slow", 1, "normal", 2, "fast", 3);
    static final int COOLDOWN_DAYS = 3;

    @Mapper
    public interface PrefMapper {
        @Select("SELECT speed, changed_at AS \"changedAt\" FROM owner_pref WHERE owner = #{owner}")
        Map<String, Object> find(@Param("owner") String owner);

        @Insert("INSERT INTO owner_pref (owner, speed) VALUES (#{owner}, #{speed})")
        void insert(@Param("owner") String owner, @Param("speed") String speed);

        @Update("UPDATE owner_pref SET speed = #{speed}, changed_at = now() WHERE owner = #{owner}")
        void update(@Param("owner") String owner, @Param("speed") String speed);
    }

    public record PrefRequest(String speed) {
    }

    private final PrefMapper prefs;

    public PrefController(PrefMapper prefs) {
        this.prefs = prefs;
    }

    /** 이 주인의 쌓는 속도 (없으면 보통) */
    public static String speedOf(PrefMapper prefs, String owner) {
        Map<String, Object> p = prefs.find(owner);
        return p == null ? "normal" : (String) p.get("speed");
    }

    @GetMapping
    public Map<String, Object> get(@AuthenticationPrincipal Long userId, HttpServletRequest req) {
        return view(prefs.find(Who.of(userId, req).owner()));
    }

    @PutMapping
    public Map<String, Object> put(@AuthenticationPrincipal Long userId, @RequestBody PrefRequest body, HttpServletRequest req) {
        if (body.speed() == null || !DAY_CAP.containsKey(body.speed())) throw new ApiException(HttpStatus.BAD_REQUEST, "속도를 다시 골라 주세요.");
        String owner = Who.of(userId, req).owner();
        Map<String, Object> p = prefs.find(owner);
        if (p == null) {
            prefs.insert(owner, body.speed());
        } else if (!body.speed().equals(p.get("speed"))) {
            OffsetDateTime next = nextChange(p);
            if (next != null && OffsetDateTime.now().isBefore(next)) {
                throw new ApiException(HttpStatus.CONFLICT, "쌓는 속도는 3일에 한 번 바꿀 수 있어요.");
            }
            prefs.update(owner, body.speed());
        }
        return view(prefs.find(owner));
    }

    private static OffsetDateTime nextChange(Map<String, Object> p) {
        Object c = p == null ? null : p.get("changedAt");
        if (c == null) return null;
        OffsetDateTime t = c instanceof OffsetDateTime o ? o
                : c instanceof java.sql.Timestamp ts ? ts.toInstant().atOffset(java.time.ZoneOffset.UTC)
                : OffsetDateTime.parse(c.toString().replace(' ', 'T'));
        return t.plusDays(COOLDOWN_DAYS);
    }

    private static Map<String, Object> view(Map<String, Object> p) {
        String speed = p == null ? "normal" : (String) p.get("speed");
        OffsetDateTime next = nextChange(p);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("speed", speed);
        m.put("dayCap", DAY_CAP.get(speed));
        m.put("chosen", p != null);
        m.put("nextChangeAt", next != null && OffsetDateTime.now().isBefore(next) ? next.toString() : null);
        return m;
    }
}
