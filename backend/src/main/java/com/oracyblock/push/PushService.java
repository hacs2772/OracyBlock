package com.oracyblock.push;

import com.oracyblock.common.Who;
import com.oracyblock.pref.PrefController;
import com.oracyblock.shop.ShopMapper;
import com.oracyblock.tower.TowerMapper;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.bouncycastle.jce.ECNamedCurveTable;
import org.bouncycastle.jce.interfaces.ECPrivateKey;
import org.bouncycastle.jce.interfaces.ECPublicKey;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.util.BigIntegers;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.Security;
import java.time.LocalDate;
import java.time.ZonedDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * 휴대폰 알림 (concept 11-32). 무료 웹 푸시(VAPID). 하루 한 번, 고른 시간(한국)에, 그날 아직 공부하지 않은 사람에게만.
 * 무엇을 보낼지(먼저 오는 것 하나): 오늘 밤 브릭이 떨어짐 → 금이 감 → 다시 만날 사람 → 그날 탑이 비어 있음
 * 탑 계산은 웹(lib/speed.js의 restEffect·tonight, lib/progress.js의 meetPlan)과 같은 규칙
 */
@Service
public class PushService {
    private static final Logger log = LoggerFactory.getLogger(PushService.class);

    /** speed.js SPEEDS와 같아야 해요 */
    record Speed(int crackAfter, int maxCracks, int fallAfter) {}
    static final Map<String, Speed> SPEEDS = Map.of(
            "slow", new Speed(3, 1, 4), "normal", new Speed(2, 2, 2), "fast", new Speed(1, 2, 1));
    static final int MAX_FALL = 5;
    static final int[] MEET_GAP = {1, 3, 7};

    private final PushMapper push;
    private final TowerMapper tower;
    private final ShopMapper shop;
    private final PrefController.PrefMapper prefs;
    private nl.martijndwars.webpush.PushService sender;
    private String publicKey;

    public PushService(PushMapper push, TowerMapper tower, ShopMapper shop, PrefController.PrefMapper prefs) {
        this.push = push;
        this.tower = tower;
        this.shop = shop;
        this.prefs = prefs;
    }

    /** 알림 열쇠: 처음 켜질 때 한 번 만들어 DB에 두고 계속 써요 (.env에 넣을 필요 없음) */
    public synchronized String publicKey() {
        if (publicKey != null) return publicKey;
        try {
            if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) Security.addProvider(new BouncyCastleProvider());
            if (push.kv("vapid_public") == null) {
                KeyPairGenerator g = KeyPairGenerator.getInstance("ECDH", BouncyCastleProvider.PROVIDER_NAME);
                g.initialize(ECNamedCurveTable.getParameterSpec("prime256v1"));
                KeyPair kp = g.generateKeyPair();
                byte[] pub = ((ECPublicKey) kp.getPublic()).getQ().getEncoded(false);
                byte[] priv = BigIntegers.asUnsignedByteArray(32, ((ECPrivateKey) kp.getPrivate()).getD());
                Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
                push.putKv("vapid_public", enc.encodeToString(pub));
                push.putKv("vapid_private", enc.encodeToString(priv));
            }
            publicKey = push.kv("vapid_public");
            sender = new nl.martijndwars.webpush.PushService(publicKey, push.kv("vapid_private"), "https://oracyblock.com");
            return publicKey;
        } catch (Exception e) {
            throw new IllegalStateException("알림 열쇠를 만들지 못했어요", e);
        }
    }

    // ---------- 무엇을 보낼지 ----------

    record Rest(int fallen, int cracks) {}
    static Rest restEffect(int g, Speed sp) {
        Deque<Integer> cracked = new ArrayDeque<>();
        int fallen = 0;
        for (int d = 1; d <= g; d++) {
            while (!cracked.isEmpty() && d - cracked.peekFirst() >= sp.fallAfter()) {
                cracked.pollFirst();
                fallen++;
            }
            if (fallen >= MAX_FALL) return new Rest(MAX_FALL, 0);
            if (d >= sp.crackAfter() && cracked.size() < sp.maxCracks()) cracked.addLast(d);
        }
        return new Rest(fallen, cracked.size());
    }

    /** 오늘 밤까지 안 하면 생기는 일: "fall" · "crack" · null (speed.js tonight와 같은 규칙, 방어권이 있으면 금은 막아 줘요) */
    String tonight(String owner, List<String> active, LocalDate today) {
        if (active.isEmpty()) return null;
        TreeSet<LocalDate> covered = new TreeSet<>();
        for (String d : active) covered.add(LocalDate.parse(d));
        for (Map<String, Object> gd : shop.guardDays(owner)) covered.add(LocalDate.parse(String.valueOf(gd.get("day"))));
        LocalDate last = covered.floor(today.minusDays(1));
        if (last == null) return null;
        int rest = (int) ChronoUnit.DAYS.between(last, today) - 1;
        Speed sp = SPEEDS.getOrDefault(PrefController.speedOf(prefs, owner), SPEEDS.get("normal"));
        Rest now = restEffect(rest, sp), next = restEffect(rest + 1, sp);
        if (next.fallen() > now.fallen()) return "fall";
        boolean shield = shop.inventory(owner).stream().anyMatch(r -> "shield".equals(r.get("item")) && ((Number) r.get("qty")).intValue() > 0);
        if (next.cracks() > now.cracks() && !shield) return "crack";
        return null;
    }

    /** 오늘 다시 만날 사람 수 (progress.js meetPlan과 같은 규칙) */
    int meetsDue(String owner, LocalDate today) {
        Map<String, TreeMap<String, Boolean>> byTalk = new HashMap<>();
        for (Map<String, Object> p : push.plays(owner)) {
            TreeMap<String, Boolean> days = byTalk.computeIfAbsent(String.valueOf(p.get("talkId")), k -> new TreeMap<>());
            days.merge(String.valueOf(p.get("day")), !Boolean.TRUE.equals(p.get("crooked")), Boolean::logicalOr);
        }
        int n = 0;
        for (TreeMap<String, Boolean> days : byTalk.values()) {
            Iterator<Map.Entry<String, Boolean>> it = days.entrySet().iterator();
            LocalDate due = LocalDate.parse(it.next().getKey()).plusDays(MEET_GAP[0]);
            int meets = 0;
            while (it.hasNext() && meets < MEET_GAP.length) {
                Map.Entry<String, Boolean> e = it.next();
                LocalDate d = LocalDate.parse(e.getKey());
                if (d.isBefore(due)) continue;
                if (!e.getValue()) { due = d.plusDays(1); continue; }
                meets++;
                if (meets < MEET_GAP.length) due = d.plusDays(MEET_GAP[meets]);
            }
            if (meets < MEET_GAP.length && !due.isAfter(today)) n++;
        }
        return n;
    }

    /** 보낼 알림 (제목, 내용) 또는 null */
    Map<String, String> messageFor(String owner, Set<String> kinds, LocalDate today) {
        List<String> active = tower.activeDays(owner);
        if (active.contains(today.toString())) return null; // 오늘 이미 공부했으면 안 보내요
        String t = kinds.contains("crack") ? tonight(owner, active, today) : null;
        if ("fall".equals(t)) return Map.of("title", "오늘 밤 브릭이 떨어져요", "body", "대화나 복습 하나만 하면 지킬 수 있어요.");
        if ("crack".equals(t)) return Map.of("title", "내 탑 꼭대기에 금이 가려고 해요", "body", "오늘 안에 대화나 복습 하나면 단단하게 지켜져요.");
        int meets = kinds.contains("meet") ? meetsDue(owner, today) : 0;
        if (meets > 0) return Map.of("title", "오늘 다시 만날 사람이 " + meets + "명 있어요", "body", "지난번과 조금 다르게 말을 걸어요.");
        if (kinds.contains("day")) return Map.of("title", "오늘 탑이 아직 비어 있어요", "body", "대화 하나면 1층이 쌓여요.");
        return null;
    }

    // ---------- 보내기 ----------

    /** 5분마다: 지금 시각(한국)을 고른 기기에 오늘 아직 안 보냈으면 한 번 */
    @Scheduled(cron = "0 */5 * * * *", zone = "Asia/Seoul")
    public void tick() {
        ZonedDateTime now = ZonedDateTime.now(Who.KST);
        LocalDate today = now.toLocalDate();
        List<Map<String, Object>> due = push.due(now.getHour(), today);
        if (due.isEmpty()) return;
        publicKey();
        for (Map<String, Object> s : due) {
            long id = ((Number) s.get("id")).longValue();
            try {
                Set<String> kinds = new HashSet<>(Arrays.asList(String.valueOf(s.get("kinds")).split(",")));
                Map<String, String> msg = messageFor(String.valueOf(s.get("owner")), kinds, today);
                log.info("알림 {}: {}", id, msg == null ? "보낼 것 없음" : msg.get("title"));
                if (msg != null) send(s, msg.get("title"), msg.get("body"));
                push.done(id, today);
            } catch (Gone g) {
                push.removeId(id); // 휴대폰에서 알림을 끄거나 지운 경우
            } catch (Exception e) {
                log.warn("알림 보내기 실패 {}: {}", id, e.getMessage());
                push.failed(id);
            }
        }
    }

    static class Gone extends Exception {}

    void send(Map<String, Object> s, String title, String body) throws Exception {
        String json = "{\"title\":" + q(title) + ",\"body\":" + q(body) + ",\"url\":\"/\"}";
        Subscription sub = new Subscription(String.valueOf(s.get("endpoint")), new Subscription.Keys(String.valueOf(s.get("p256dh")), String.valueOf(s.get("auth"))));
        HttpResponse res = sender.send(new Notification(sub, json), Encoding.AES128GCM);
        int code = res.getStatusLine().getStatusCode();
        if (code == 404 || code == 410) throw new Gone();
        if (code >= 400) throw new IllegalStateException("push " + code);
    }

    /** 시험 보내기 (알림을 켠 바로 그때 "이렇게 와요") */
    public void sendTest(Map<String, Object> s) throws Exception {
        publicKey();
        send(s, "알림이 켜졌어요", "이렇게 하루 한 번만 알려 드릴게요.");
    }

    private static String q(String s) {
        return "\"" + s.replace("\\", "\\\\").replace("\"", "\\\"") + "\"";
    }
}
