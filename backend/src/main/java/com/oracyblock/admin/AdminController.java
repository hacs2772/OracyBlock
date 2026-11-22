package com.oracyblock.admin;

import com.oracyblock.common.Who;
import com.oracyblock.report.ReportController.ReportMapper;
import com.oracyblock.user.UserMapper;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 관리자 화면 (관리자 계정만, SecurityConfig) */
@RestController
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminMapper admin;
    private final UserMapper users;
    private final ReportMapper reports;
    private final com.oracyblock.error.ErrorController.ErrorMapper errors;

    public AdminController(AdminMapper admin, UserMapper users, ReportMapper reports, com.oracyblock.error.ErrorController.ErrorMapper errors) {
        this.errors = errors;
        this.admin = admin;
        this.users = users;
        this.reports = reports;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats() {
        LocalDate today = Who.today();
        Map<String, Object> people = new LinkedHashMap<>(admin.people(today));
        people.putAll(admin.comeBack(today));
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("people", people);
        m.put("plays", admin.plays(today));
        m.put("review", admin.review());
        m.put("days", admin.days(today));
        m.put("funnel", admin.funnel(today));
        m.put("stuck", admin.stuck(today));
        m.put("talks", admin.talks());
        m.put("openFeedback", admin.openFeedback());
        m.put("openReports", reports.openCount());
        m.put("openErrors", errors.openCount());
        return m;
    }

    /** 어려운 차례 (min = 최소 몇 번 한 대사부터) */
    @GetMapping("/turns")
    public List<Map<String, Object>> turns(@RequestParam(defaultValue = "1") int min) {
        return admin.hardTurns(Math.max(1, Math.min(50, min)));
    }

    @GetMapping("/users")
    public List<Map<String, Object>> users() {
        return users.recent();
    }

    @GetMapping("/feedback")
    public List<Map<String, Object>> feedback() {
        return admin.feedback();
    }

    public record DoneRequest(boolean done) {
    }

    /** 문의 처리 완료 표시 (다시 풀 수도 있어요) */
    @PutMapping("/feedback/{id}")
    public Map<String, Object> markFeedback(@PathVariable long id, @RequestBody DoneRequest body) {
        admin.markFeedback(id, body.done());
        return Map.of("ok", true);
    }
}
