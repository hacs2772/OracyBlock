package com.oracyblock.shop;

import org.apache.ibatis.annotations.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Mapper
public interface ShopMapper {

    @Select("SELECT COALESCE((SELECT bricks FROM wallet WHERE owner = #{owner}), 0)")
    int balance(@Param("owner") String owner);

    /** 사기·쓰기 전에 그 사람 지갑을 잠가요 (두 번 동시에 눌러도 브릭이 0 밑으로 안 가게). 지갑이 없으면 0 */
    @Select("SELECT COALESCE((SELECT bricks FROM wallet WHERE owner = #{owner} FOR UPDATE), 0)")
    int lockBalance(@Param("owner") String owner);

    @Insert("""
        INSERT INTO wallet (owner, bricks) VALUES (#{owner}, #{delta})
        ON CONFLICT (owner) DO UPDATE SET bricks = wallet.bricks + #{delta}, updated_at = now()
        """)
    void addBricks(@Param("owner") String owner, @Param("delta") int delta);

    /** 미션 보상 기록. 이미 받았으면 0 (같은 owner + reason은 한 번만) */
    @Insert("INSERT INTO wallet_log (owner, delta, reason) VALUES (#{owner}, #{delta}, #{reason}) ON CONFLICT DO NOTHING")
    int log(@Param("owner") String owner, @Param("delta") int delta, @Param("reason") String reason);

    @Select("SELECT reason FROM wallet_log WHERE owner = #{owner} AND reason LIKE 'm:%' AND created_at > now() - interval '9 days'")
    List<String> recentClaims(@Param("owner") String owner);

    @Select("SELECT item, qty, equipped FROM inventory WHERE owner = #{owner}")
    List<Map<String, Object>> inventory(@Param("owner") String owner);

    @Insert("""
        INSERT INTO inventory (owner, item, qty, equipped) VALUES (#{owner}, #{item}, #{delta}, #{equip})
        ON CONFLICT (owner, item) DO UPDATE SET qty = inventory.qty + #{delta}, equipped = inventory.equipped OR #{equip}
        """)
    void addItem(@Param("owner") String owner, @Param("item") String item, @Param("delta") int delta, @Param("equip") boolean equip);

    /** 하나 쓰기. 남은 게 없으면 0 */
    @Update("UPDATE inventory SET qty = qty - 1 WHERE owner = #{owner} AND item = #{item} AND qty > 0")
    int useOne(@Param("owner") String owner, @Param("item") String item);

    @Update("UPDATE inventory SET equipped = #{on} WHERE owner = #{owner} AND item = #{item} AND qty > 0")
    int equip(@Param("owner") String owner, @Param("item") String item, @Param("on") boolean on);

    @Select("SELECT to_char(day, 'YYYY-MM-DD') AS day, kind FROM guard_day WHERE owner = #{owner} ORDER BY day")
    List<Map<String, Object>> guardDays(@Param("owner") String owner);

    @Insert("INSERT INTO guard_day (owner, day, kind) VALUES (#{owner}, #{day}, #{kind}) ON CONFLICT DO NOTHING")
    int guard(@Param("owner") String owner, @Param("day") LocalDate day, @Param("kind") String kind);

    // ---------- 미션 진행 (한국 날짜) ----------

    @Select("SELECT COUNT(*) FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL AND day = #{day}")
    int finished(@Param("owner") String owner, @Param("day") LocalDate day);

    @Select("SELECT COUNT(*) FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL AND day = #{day} AND NOT crooked")
    int finishedStraight(@Param("owner") String owner, @Param("day") LocalDate day);

    @Select("SELECT COUNT(*) FROM word_answer WHERE owner = #{owner} AND day = #{day}")
    int answered(@Param("owner") String owner, @Param("day") LocalDate day);

    @Select("""
        SELECT COUNT(*) FROM play p WHERE p.owner = #{owner} AND p.finished_at IS NOT NULL AND p.day = #{day}
          AND NOT EXISTS (SELECT 1 FROM play q WHERE q.owner = p.owner AND q.talk_id = p.talk_id AND q.finished_at IS NOT NULL AND q.day < #{day})
        """)
    int newPlaces(@Param("owner") String owner, @Param("day") LocalDate day);

    @Select("SELECT COUNT(*) FROM fix_item WHERE owner = #{owner} AND fixed_at IS NOT NULL AND (fixed_at AT TIME ZONE 'Asia/Seoul')::date = #{day}")
    int fixedOn(@Param("owner") String owner, @Param("day") LocalDate day);

    @Select("""
        SELECT COUNT(*) FROM (
          SELECT day FROM play WHERE owner = #{owner} AND finished_at IS NOT NULL AND day >= #{since}
          UNION SELECT day FROM word_answer WHERE owner = #{owner} AND day >= #{since}
        ) x
        """)
    int daysSince(@Param("owner") String owner, @Param("since") LocalDate since);

    // ---------- 가입·로그인하면 둘러보기 기록을 계정으로 ----------

    @Insert("""
        INSERT INTO wallet (owner, bricks) SELECT #{to}, bricks FROM wallet WHERE owner = #{from}
        ON CONFLICT (owner) DO UPDATE SET bricks = wallet.bricks + EXCLUDED.bricks
        """)
    void mergeWallet(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM wallet WHERE owner = #{owner}")
    void deleteWallet(@Param("owner") String owner);

    @Update("UPDATE wallet_log SET owner = #{to} WHERE owner = #{from} AND reason NOT IN (SELECT reason FROM wallet_log WHERE owner = #{to})")
    void moveLog(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM wallet_log WHERE owner = #{owner}")
    void deleteLog(@Param("owner") String owner);

    @Insert("""
        INSERT INTO inventory (owner, item, qty, equipped) SELECT #{to}, item, qty, equipped FROM inventory WHERE owner = #{from}
        ON CONFLICT (owner, item) DO UPDATE SET qty = CASE WHEN inventory.item IN ('shield', 'rest') THEN inventory.qty + EXCLUDED.qty ELSE GREATEST(inventory.qty, EXCLUDED.qty) END,
          equipped = inventory.equipped OR EXCLUDED.equipped
        """)
    void mergeInventory(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM inventory WHERE owner = #{owner}")
    void deleteInventory(@Param("owner") String owner);

    @Insert("INSERT INTO guard_day (owner, day, kind) SELECT #{to}, day, kind FROM guard_day WHERE owner = #{from} ON CONFLICT DO NOTHING")
    void copyGuards(@Param("from") String from, @Param("to") String to);

    @Delete("DELETE FROM guard_day WHERE owner = #{owner}")
    void deleteGuards(@Param("owner") String owner);
}
