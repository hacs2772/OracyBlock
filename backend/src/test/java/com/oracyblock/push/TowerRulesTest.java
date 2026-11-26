package com.oracyblock.push;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import com.oracyblock.pref.PrefController;
import com.oracyblock.shop.ShopService;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.io.InputStream;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

/**
 * 웹(lib/speed.js · lib/tower.js · lib/progress.js)과 서버(TowerCalc · PushService)가 같은 답을 내는지.
 * 답 파일은 웹에서 만들어요: cd web && npm run fixture → src/test/resources/rules-fixture.json
 * 여기서 틀리면 알림이 앱의 탑과 다른 말을 해요 ("오늘 밤 떨어져요"인데 앱은 괜찮다고 하는 등)
 */
class TowerRulesTest {
    static JsonNode fx;

    @BeforeAll
    static void load() throws Exception {
        try (InputStream in = TowerRulesTest.class.getResourceAsStream("/rules-fixture.json")) {
            fx = JsonMapper.builder().build().readTree(in);
        }
    }

    private static List<String> strings(JsonNode arr) {
        List<String> out = new ArrayList<>();
        for (JsonNode n : arr) out.add(n.asString());
        return out;
    }

    @Test
    void 쉬는_날_금과_떨어짐이_웹과_같아요() {
        for (JsonNode r : fx.get("rest")) {
            TowerCalc.Rest got = TowerCalc.restEffect(r.get("g").asInt(), TowerCalc.speedOf(r.get("speed").asString()));
            String at = r.get("speed").asString() + " g=" + r.get("g").asInt();
            assertEquals(r.get("fallen").asInt(), got.fallen(), at + " fallen");
            assertEquals(r.get("cracks").asInt(), got.cracks(), at + " cracks");
            assertEquals(r.get("capped").asBoolean(), got.capped(), at + " capped");
        }
    }

    @Test
    void 탑과_오늘_밤_경고가_웹과_같아요() {
        int i = 0;
        for (JsonNode t : fx.get("towers")) {
            List<TowerCalc.Brick> bricks = new ArrayList<>();
            for (JsonNode b : t.get("bricks")) bricks.add(new TowerCalc.Brick(b.get("day").asString(), b.get("cap").asInt()));
            String speed = t.get("nowSpeed").asString();
            TowerCalc.Now now = TowerCalc.build(bricks, strings(t.get("activeDays")), LocalDate.parse(t.get("today").asString()), speed, strings(t.get("guardDays")));
            String at = "tower #" + i++;
            assertEquals(t.get("floors").asInt(), now.floors(), at + " floors");
            assertEquals(t.get("rest").asInt(), now.rest(), at + " rest");
            assertEquals(t.get("cracks").asInt(), now.cracks(), at + " cracks");
            assertEquals(t.get("capped").asBoolean(), now.capped(), at + " capped");
            String w = now.capped() ? null : TowerCalc.tonight(now.rest(), TowerCalc.speedOf(speed), now.floors());
            JsonNode want = t.get("tonight");
            assertEquals(want == null || want.isNull() ? null : want.asString(), w, at + " tonight");
        }
    }

    @Test
    void 다시_만날_사람_수가_웹과_같아요() {
        int i = 0;
        for (JsonNode m : fx.get("meets")) {
            List<Map<String, Object>> plays = new ArrayList<>();
            for (JsonNode p : m.get("plays")) {
                plays.add(Map.of("talkId", p.get("talkId").asString(), "day", p.get("day").asString(), "crooked", p.get("crooked").asBoolean()));
            }
            assertEquals(m.get("due").asInt(), PushService.countDueMeets(plays, LocalDate.parse(m.get("today").asString())), "meets #" + i++);
        }
    }

    @Test
    void 남은_층이_없으면_떨어진다고_하지_않아요() {
        TowerCalc.Speed fast = TowerCalc.speedOf("fast");
        assertNull(TowerCalc.tonight(5, fast, 0));
        assertEquals("fall", TowerCalc.tonight(1, fast, 1));
    }

    @Test
    void 상점_꾸미기_자리가_웹과_같아요() {
        Map<String, String> web = new TreeMap<>();
        fx.get("slots").properties().forEach(e -> web.put(e.getKey(), e.getValue().asString()));
        Map<String, String> server = new TreeMap<>();
        for (ShopService.Item it : ShopService.ITEMS) if (it.look()) server.put(it.id(), it.slot());
        assertEquals(web, server, "웹 lib/looks.js SLOT_OF 와 서버 ShopService.ITEMS 의 slot");
    }

    @Test
    void 쌓는_속도별_하루_최대_층이_웹과_같아요() {
        Map<String, Integer> web = new TreeMap<>();
        fx.get("caps").properties().forEach(e -> web.put(e.getKey(), e.getValue().asInt()));
        assertEquals(web, new TreeMap<>(PrefController.DAY_CAP), "웹 speed.js SPEEDS.bricks 와 서버 PrefController.DAY_CAP");
        for (Map.Entry<String, Integer> e : web.entrySet()) assertEquals(e.getValue(), TowerCalc.speedOf(e.getKey()).cap(), "TowerCalc " + e.getKey());
    }
}
