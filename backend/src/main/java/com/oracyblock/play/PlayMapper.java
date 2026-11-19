package com.oracyblock.play;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface PlayMapper {

    @Insert("INSERT INTO play (owner, user_id, visitor_id, talk_id, level) VALUES (#{owner}, #{userId}, #{visitorId}, #{talkId}, #{level})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insert(NewPlay p);

    @Select("SELECT owner, finished_at IS NOT NULL AS finished FROM play WHERE id = #{id}")
    Map<String, Object> ownerOf(@Param("id") long id);

    @Update("""
        UPDATE play SET finished_at = now(), day = #{day}, crooked = #{f.crooked}, bounces = #{f.bounces}, hints = #{f.hints},
          speak_n = #{f.speakN}, write_n = #{f.writeN}, choose_n = #{f.chooseN}, ok_n = #{f.okN}, near_n = #{f.nearN},
          rescue_n = #{f.rescueN}, bricks = #{f.bricks}
        WHERE id = #{id} AND finished_at IS NULL
        """)
    int finish(@Param("id") long id, @Param("day") LocalDate day, @Param("f") PlayController.FinishRequest f);

    @Insert("INSERT INTO fix_item (owner, play_id, turn_idx, kind, prev) VALUES (#{owner}, #{playId}, #{turnIdx}, #{kind}, #{prev})")
    void insertFix(@Param("owner") String owner, @Param("playId") long playId, @Param("turnIdx") int turnIdx,
                   @Param("kind") String kind, @Param("prev") String prev);

    @Insert("""
        INSERT INTO word (owner, word_key, ko, mean, say, stage, due_day, missed)
        VALUES (#{owner}, #{w.key}, #{w.ko}, #{w.mean}, #{w.say}, #{stage}, #{due}, #{missedInc})
        ON CONFLICT (owner, word_key) DO UPDATE SET
          stage = CASE WHEN #{missedInc} > 0 THEN 0 ELSE word.stage END,
          due_day = CASE WHEN #{missedInc} > 0 THEN LEAST(word.due_day, EXCLUDED.due_day) ELSE word.due_day END,
          missed = word.missed + #{missedInc},
          updated_at = now()
        """)
    void upsertWord(@Param("owner") String owner, @Param("w") PlayController.WordIn w, @Param("stage") int stage,
                    @Param("due") LocalDate due, @Param("missedInc") int missedInc);

    @Select("""
        SELECT id, talk_id AS "talkId", level, crooked, bounces, bricks, to_char(day, 'YYYY-MM-DD') AS day,
          to_char(finished_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "finishedAt"
        FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL
        ORDER BY finished_at DESC LIMIT 300
        """)
    List<Map<String, Object>> finished(@Param("owner") String owner);

    @Select("SELECT COUNT(*) FROM fix_item WHERE owner = #{owner} AND fixed_at IS NULL")
    int openFixes(@Param("owner") String owner);

    @Select("SELECT COUNT(*) FILTER (WHERE due_day <= #{today}) AS due, COUNT(*) AS total FROM word WHERE owner = #{owner}")
    Map<String, Object> wordCounts(@Param("owner") String owner, @Param("today") LocalDate today);

    class NewPlay {
        public Long id;
        public String owner;
        public Long userId;
        public String visitorId;
        public String talkId;
        public int level;

        public NewPlay(String owner, Long userId, String visitorId, String talkId, int level) {
            this.owner = owner;
            this.userId = userId;
            this.visitorId = visitorId;
            this.talkId = talkId;
            this.level = level;
        }
    }
}
