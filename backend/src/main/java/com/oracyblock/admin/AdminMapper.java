package com.oracyblock.admin;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** 관리자 통계. s_visit / s_play 는 관리자 기기를 뺀 보기(V1__init.sql) */
@Mapper
public interface AdminMapper {

    @Select("""
        SELECT
          (SELECT COUNT(DISTINCT visitor_id) FROM s_visit WHERE day = #{today}) AS "visitorsToday",
          (SELECT COUNT(DISTINCT visitor_id) FROM s_visit WHERE day = #{today} - 1) AS "visitorsYesterday",
          (SELECT COUNT(DISTINCT visitor_id) FROM s_visit WHERE day > #{today} - 7) AS "visitors7d",
          (SELECT COUNT(DISTINCT visitor_id) FROM s_visit) AS "visitorsTotal",
          (SELECT COUNT(*) FROM users WHERE role <> 'ADMIN') AS members,
          (SELECT COUNT(*) FROM users WHERE role <> 'ADMIN' AND (created_at AT TIME ZONE 'Asia/Seoul')::date = #{today}) AS "membersToday",
          (SELECT COUNT(*) FROM users WHERE role <> 'ADMIN' AND (created_at AT TIME ZONE 'Asia/Seoul')::date > #{today} - 7) AS "members7d"
        """)
    Map<String, Object> people(@Param("today") LocalDate today);

    /** 최근 14일 안에 처음 온 사람(어제까지) 중 다음 날 이후 다시 온 사람 */
    @Select("""
        WITH f AS (SELECT visitor_id, MIN(day) AS first FROM s_visit GROUP BY visitor_id)
        SELECT COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM s_visit v WHERE v.visitor_id = f.visitor_id AND v.day > f.first)) AS "cameBack",
               COUNT(*) AS "canComeBack"
        FROM f WHERE f.first > #{today} - 14 AND f.first < #{today}
        """)
    Map<String, Object> comeBack(@Param("today") LocalDate today);

    @Select("""
        SELECT
          COUNT(*) FILTER (WHERE (started_at AT TIME ZONE 'Asia/Seoul')::date = #{today}) AS "startedToday",
          COUNT(*) FILTER (WHERE day = #{today}) AS "finishedToday",
          COUNT(*) AS "startedTotal",
          COUNT(*) FILTER (WHERE finished_at IS NOT NULL) AS "finishedTotal",
          COALESCE(SUM(speak_n), 0) AS "speakN", COALESCE(SUM(write_n), 0) AS "writeN", COALESCE(SUM(choose_n), 0) AS "chooseN"
        FROM s_play
        """)
    Map<String, Object> plays(@Param("today") LocalDate today);

    @Select("""
        SELECT (SELECT COUNT(*) FROM word_answer) AS "wordAnswers",
               (SELECT COUNT(*) FROM word_answer WHERE ok) AS "wordOk",
               (SELECT COUNT(*) FROM fix_item WHERE fixed_at IS NOT NULL) AS "fixesDone"
        """)
    Map<String, Object> review();

    @Select("""
        SELECT to_char(d, 'YYYY-MM-DD') AS day,
          (SELECT COUNT(DISTINCT visitor_id) FROM s_visit WHERE day = d) AS visitors,
          (SELECT COUNT(*) FROM users WHERE role <> 'ADMIN' AND (created_at AT TIME ZONE 'Asia/Seoul')::date = d) AS signups,
          (SELECT COUNT(*) FROM s_play WHERE (started_at AT TIME ZONE 'Asia/Seoul')::date = d) AS started,
          (SELECT COUNT(*) FROM s_play WHERE day = d) AS finished
        FROM generate_series(#{today} - 13, #{today}::date, interval '1 day') AS g(d)
        ORDER BY d DESC
        """)
    List<Map<String, Object>> days(@Param("today") LocalDate today);

    @Select("""
        WITH f AS (SELECT visitor_id, MIN(day) AS first FROM s_visit GROUP BY visitor_id HAVING MIN(day) > #{today} - 14)
        SELECT COUNT(*) AS came,
          COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM s_play p WHERE p.visitor_id = f.visitor_id)) AS started,
          COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM s_play p WHERE p.visitor_id = f.visitor_id AND p.finished_at IS NOT NULL)) AS finished,
          COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM s_visit v WHERE v.visitor_id = f.visitor_id AND v.user_id IS NOT NULL)
            OR EXISTS (SELECT 1 FROM s_play p WHERE p.visitor_id = f.visitor_id AND p.user_id IS NOT NULL)) AS joined,
          COUNT(*) FILTER (WHERE EXISTS (SELECT 1 FROM s_visit v WHERE v.visitor_id = f.visitor_id AND v.day > f.first)) AS "cameBack"
        FROM f
        """)
    Map<String, Object> funnel(@Param("today") LocalDate today);

    @Select("""
        SELECT talk_id AS "talkId", COUNT(*) AS started,
          COUNT(*) FILTER (WHERE finished_at IS NOT NULL) AS finished,
          COUNT(*) FILTER (WHERE finished_at IS NOT NULL AND NOT crooked) AS correct,
          COALESCE(ROUND(AVG(bounces) FILTER (WHERE finished_at IS NOT NULL), 1), 0) AS "avgBounces"
        FROM s_play GROUP BY talk_id ORDER BY started DESC
        """)
    List<Map<String, Object>> talks();

    @Select("""
        SELECT f.id, f.message, f.page, u.nickname,
          to_char(f.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "createdAt"
        FROM feedback f LEFT JOIN users u ON u.id = f.user_id ORDER BY f.created_at DESC LIMIT 200
        """)
    List<Map<String, Object>> feedback();
}
