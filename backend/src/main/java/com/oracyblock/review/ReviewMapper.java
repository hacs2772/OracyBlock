package com.oracyblock.review;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface ReviewMapper {

    @Select("""
        SELECT word_key AS key, ko, mean, say, stage, missed, to_char(due_day, 'YYYY-MM-DD') AS "dueDay"
        FROM word WHERE owner = #{owner} ORDER BY due_day, missed DESC, ko LIMIT 500
        """)
    List<Map<String, Object>> words(@Param("owner") String owner);

    @Select("SELECT stage FROM word WHERE owner = #{owner} AND word_key = #{key}")
    Integer stageOf(@Param("owner") String owner, @Param("key") String key);

    @Update("UPDATE word SET stage = #{stage}, due_day = #{due}, missed = missed + #{missInc}, updated_at = now() WHERE owner = #{owner} AND word_key = #{key}")
    void schedule(@Param("owner") String owner, @Param("key") String key, @Param("stage") int stage,
                  @Param("due") LocalDate due, @Param("missInc") int missInc);

    @Insert("INSERT INTO word_answer (owner, ok, word_key, ko, day) SELECT #{owner}, #{ok}, word_key, ko, #{day} FROM word WHERE owner = #{owner} AND word_key = #{key}")
    void answer(@Param("owner") String owner, @Param("key") String key, @Param("ok") boolean ok, @Param("day") LocalDate day);

    /** 복습 탑: 맞힌 단어 브릭 (최근 것부터 120개) */
    @Select("""
        SELECT ko, to_char(day, 'YYYY-MM-DD') AS day FROM word_answer
        WHERE owner = #{owner} AND ok AND ko IS NOT NULL ORDER BY at DESC LIMIT 120
        """)
    List<Map<String, Object>> towerBricks(@Param("owner") String owner);

    @Select("SELECT COUNT(*) FROM word_answer WHERE owner = #{owner} AND ok")
    int towerTotal(@Param("owner") String owner);

    @Select("""
        SELECT f.id, f.play_id AS "playId", f.turn_idx AS "turnIdx", f.kind, f.prev,
          p.talk_id AS "talkId", p.level, p.bricks,
          to_char(p.finished_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "finishedAt"
        FROM fix_item f JOIN play p ON p.id = f.play_id
        WHERE f.owner = #{owner} AND f.fixed_at IS NULL
        ORDER BY p.finished_at DESC, f.turn_idx LIMIT 200
        """)
    List<Map<String, Object>> openFixes(@Param("owner") String owner);

    @Select("SELECT play_id FROM fix_item WHERE id = #{id} AND owner = #{owner} AND fixed_at IS NULL")
    Long openFixPlay(@Param("id") long id, @Param("owner") String owner);

    @Update("UPDATE fix_item SET fixed_how = #{how}, fixed_at = now() WHERE id = #{id}")
    void markFixed(@Param("id") long id, @Param("how") String how);

    /** 고친 모양만 바꿔요. crooked(올바른 탑인지)는 그대로: 고친 탑은 레벨 추천에 세지 않아요 */
    @Update("UPDATE play SET bricks = #{bricks} WHERE id = #{playId}")
    void updateBricks(@Param("playId") long playId, @Param("bricks") String bricks);
}
