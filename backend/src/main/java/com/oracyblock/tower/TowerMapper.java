package com.oracyblock.tower;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface TowerMapper {

    /** 하루 최대 3개, 레벨이 높은 대화부터 */
    @Select("""
        SELECT to_char(day, 'YYYY-MM-DD') AS day, level, talk_id AS "talkId" FROM (
          SELECT day, level, talk_id, finished_at,
                 ROW_NUMBER() OVER (PARTITION BY day ORDER BY level DESC, finished_at) AS rn
          FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL
        ) x WHERE rn <= 3 ORDER BY day, level, finished_at
        """)
    List<Map<String, Object>> bricks(@Param("owner") String owner);

    @Select("""
        WITH b AS (
          SELECT user_id, LEAST(COUNT(*), 3) AS c FROM play
          WHERE user_id IS NOT NULL AND finished_at IS NOT NULL AND day >= #{since}
          GROUP BY user_id, day
        ), t AS (SELECT user_id, SUM(c) AS bricks FROM b GROUP BY user_id)
        SELECT RANK() OVER (ORDER BY t.bricks DESC) AS rank, u.nickname, t.bricks, t.user_id AS "userId"
        FROM t JOIN users u ON u.id = t.user_id
        ORDER BY t.bricks DESC, u.nickname LIMIT 500
        """)
    List<Map<String, Object>> ranking(@Param("since") LocalDate since);
}
