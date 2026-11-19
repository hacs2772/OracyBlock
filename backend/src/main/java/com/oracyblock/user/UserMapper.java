package com.oracyblock.user;

import org.apache.ibatis.annotations.*;

import java.util.List;
import java.util.Map;

@Mapper
public interface UserMapper {

    String COLS = """
        id, email, nickname, role, level, password_hash AS "passwordHash",
        to_char(created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "createdAt"
        """;

    @Select("SELECT " + COLS + " FROM users WHERE email = #{email}")
    Map<String, Object> findByEmail(@Param("email") String email);

    @Select("SELECT " + COLS + " FROM users WHERE id = #{id}")
    Map<String, Object> findById(@Param("id") long id);

    @Select("SELECT EXISTS (SELECT 1 FROM users WHERE lower(nickname) = lower(#{nickname}) AND id <> #{exceptId})")
    boolean nicknameTaken(@Param("nickname") String nickname, @Param("exceptId") long exceptId);

    @Insert("INSERT INTO users (email, password_hash, nickname, role) VALUES (#{email}, #{hash}, #{nickname}, #{role})")
    @Options(useGeneratedKeys = true, keyProperty = "id", keyColumn = "id")
    void insert(NewUser u);

    @Update("UPDATE users SET nickname = #{nickname} WHERE id = #{id}")
    void updateNickname(@Param("id") long id, @Param("nickname") String nickname);

    @Update("UPDATE users SET level = #{level} WHERE id = #{id}")
    void updateLevel(@Param("id") long id, @Param("level") int level);

    @Update("UPDATE users SET password_hash = #{hash}, role = 'ADMIN' WHERE id = #{id}")
    void makeAdmin(@Param("id") long id, @Param("hash") String hash);

    @Update("UPDATE users SET last_seen_at = now() WHERE id = #{id}")
    void touch(@Param("id") long id);

    @Delete("DELETE FROM users WHERE id = #{id}")
    void delete(@Param("id") long id);

    // ---- 가입 안 하고 한 기록을 내 계정으로 옮기기 ----
    @Update("UPDATE play SET owner = #{to}, user_id = #{userId} WHERE owner = #{from}")
    void movePlays(@Param("from") String from, @Param("to") String to, @Param("userId") long userId);

    @Update("UPDATE visit_day SET user_id = #{userId} WHERE visitor_id = #{visitorId} AND day = #{day}")
    void linkVisit(@Param("visitorId") String visitorId, @Param("day") java.time.LocalDate day, @Param("userId") long userId);

    @Update("UPDATE fix_item SET owner = #{to} WHERE owner = #{from}")
    void moveFixes(@Param("from") String from, @Param("to") String to);

    @Insert("""
        INSERT INTO word (owner, word_key, ko, mean, say, stage, due_day, missed, updated_at)
        SELECT #{to}, word_key, ko, mean, say, stage, due_day, missed, updated_at FROM word WHERE owner = #{from}
        ON CONFLICT (owner, word_key) DO NOTHING
        """)
    void copyWords(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM word WHERE owner = #{owner}")
    void deleteWords(@Param("owner") String owner);

    @Update("UPDATE word_answer SET owner = #{to} WHERE owner = #{from}")
    void moveAnswers(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM word_answer WHERE owner = #{owner}")
    void deleteAnswers(@Param("owner") String owner);

    @Delete("DELETE FROM fix_item WHERE owner = #{owner}")
    void deleteFixes(@Param("owner") String owner);

    @Select("""
        SELECT u.id, u.email, u.nickname, u.role, u.level,
          to_char(u.created_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "createdAt",
          to_char(u.last_seen_at AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') AS "lastSeenAt",
          (SELECT COUNT(*) FROM play p WHERE p.user_id = u.id AND p.finished_at IS NOT NULL) AS finished
        FROM users u ORDER BY u.created_at DESC LIMIT 100
        """)
    List<Map<String, Object>> recent();

    /** 새 사람 넣을 때 쓰는 그릇 (id는 넣은 뒤에 채워짐) */
    class NewUser {
        public Long id;
        public String email;
        public String hash;
        public String nickname;
        public String role;

        public NewUser(String email, String hash, String nickname, String role) {
            this.email = email;
            this.hash = hash;
            this.nickname = nickname;
            this.role = role;
        }
    }
}
