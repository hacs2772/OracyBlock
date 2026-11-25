package com.oracyblock.push;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/** 휴대폰 알림 (concept 11-32) */
@Mapper
public interface PushMapper {
    @Select("SELECT v FROM app_kv WHERE k = #{k}")
    String kv(@Param("k") String k);

    @Insert("INSERT INTO app_kv (k, v) VALUES (#{k}, #{v}) ON CONFLICT (k) DO NOTHING")
    void putKv(@Param("k") String k, @Param("v") String v);

    @Insert("""
        INSERT INTO push_sub (owner, endpoint, p256dh, auth, hour, kinds) VALUES (#{owner}, #{endpoint}, #{p256dh}, #{auth}, #{hour}, #{kinds})
        ON CONFLICT (endpoint) DO UPDATE SET owner = EXCLUDED.owner, p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth,
          hour = EXCLUDED.hour, kinds = EXCLUDED.kinds, fails = 0
        """)
    void upsert(@Param("owner") String owner, @Param("endpoint") String endpoint, @Param("p256dh") String p256dh,
                @Param("auth") String auth, @Param("hour") int hour, @Param("kinds") String kinds);

    @Update("UPDATE push_sub SET hour = #{hour}, kinds = #{kinds} WHERE endpoint = #{endpoint} AND owner = #{owner}")
    int pref(@Param("owner") String owner, @Param("endpoint") String endpoint, @Param("hour") int hour, @Param("kinds") String kinds);

    @Delete("DELETE FROM push_sub WHERE endpoint = #{endpoint} AND owner = #{owner}")
    int remove(@Param("owner") String owner, @Param("endpoint") String endpoint);

    @Delete("DELETE FROM push_sub WHERE id = #{id}")
    void removeId(@Param("id") long id);

    @Select("SELECT hour, kinds FROM push_sub WHERE endpoint = #{endpoint} AND owner = #{owner}")
    Map<String, Object> mine(@Param("owner") String owner, @Param("endpoint") String endpoint);

    /** 지금 시각(한국)에 보낼 차례인 기기: 오늘 아직 안 본 것만 */
    @Select("SELECT id, owner, endpoint, p256dh, auth, kinds FROM push_sub WHERE hour = #{hour} AND (last_day IS NULL OR last_day < #{today})")
    List<Map<String, Object>> due(@Param("hour") int hour, @Param("today") LocalDate today);

    @Update("UPDATE push_sub SET last_day = #{today}, fails = 0 WHERE id = #{id}")
    void done(@Param("id") long id, @Param("today") LocalDate today);

    /** 보내기 실패: 그날은 다시 안 보내요(5분마다 되풀이하지 않게). 다음 날 다시 해 봐요 */
    @Update("UPDATE push_sub SET fails = fails + 1, last_day = #{today} WHERE id = #{id}")
    void failed(@Param("id") long id, @Param("today") LocalDate today);

    /** 여러 날 계속 실패한 기기는 지워요 (알림 서버가 더는 받지 않는 기기) */
    @Delete("DELETE FROM push_sub WHERE id = #{id} AND fails >= #{max}")
    int dropDead(@Param("id") long id, @Param("max") int max);

    @Update("UPDATE push_sub SET owner = #{to} WHERE owner = #{from}")
    void claimOwner(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM push_sub WHERE owner = #{owner}")
    void deleteOwner(@Param("owner") String owner);

    /** 다시 만나기 계산용: 끝낸 대화의 날짜와 비뚤어짐 (오래된 것부터) */
    @Select("SELECT talk_id AS \"talkId\", to_char(day, 'YYYY-MM-DD') AS day, crooked FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL AND day IS NOT NULL ORDER BY finished_at")
    List<Map<String, Object>> plays(@Param("owner") String owner);
}
