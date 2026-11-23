package com.oracyblock.tower;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface TowerMapper {

    /** 하루에 쌓는 속도만큼(그날 최대 브릭 수), 레벨이 높은 대화부터 */
    @Select("""
        SELECT to_char(day, 'YYYY-MM-DD') AS day, level, talk_id AS "talkId", cap FROM (
          SELECT day, level, talk_id, finished_at,
                 ROW_NUMBER() OVER (PARTITION BY day ORDER BY level DESC, finished_at) AS rn,
                 MAX(day_cap) OVER (PARTITION BY day) AS cap
          FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL
        ) x WHERE rn <= cap ORDER BY day, level, finished_at
        """)
    List<Map<String, Object>> bricks(@Param("owner") String owner);

    /** 공부한 날: 대화를 끝냈거나 단어를 복습한 날 */
    @Select("""
        SELECT to_char(day, 'YYYY-MM-DD') FROM (
          SELECT day FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL
          UNION SELECT day FROM word_answer WHERE owner = #{owner}
        ) x ORDER BY 1
        """)
    List<String> activeDays(@Param("owner") String owner);

    /** 순위 = 공부한 날 수 (쌓는 속도와 상관없이 꾸준함만) */
    @Select("""
        WITH d AS (
          SELECT user_id, day FROM play WHERE user_id IS NOT NULL AND finished_at IS NOT NULL AND day >= #{since}
          UNION
          SELECT CAST(substring(owner FROM 3) AS BIGINT), day FROM word_answer WHERE owner LIKE 'u:%' AND day >= #{since}
        ), t AS (SELECT user_id, COUNT(DISTINCT day) AS days FROM d GROUP BY user_id)
        SELECT RANK() OVER (ORDER BY t.days DESC) AS rank, u.nickname, t.days, t.user_id AS "userId"
        FROM t JOIN users u ON u.id = t.user_id
        ORDER BY t.days DESC, u.nickname LIMIT 500
        """)
    List<Map<String, Object>> ranking(@Param("since") LocalDate since);
}
