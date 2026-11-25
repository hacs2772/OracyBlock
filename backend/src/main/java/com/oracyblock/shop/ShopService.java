package com.oracyblock.shop;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import com.oracyblock.pref.PrefController;
import com.oracyblock.tower.TowerMapper;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * 상점·미션 (concept 11-21). 재화 = 브릭.
 * 미션: 날마다 3개(대화 1개는 늘 + 나머지 4개 중 2개가 날짜마다 돌아가며) + 이번 주 미션 1개. 다 하면 [받기]
 * 상점: 방어권(쉰 날 금 가기 직전에 저절로) · 쉬어가기권(미리 고른 날) · 꾸미기(깃발 · 초롱 · 금빛 받침판)
 */
@Service
public class ShopService {

    public record Mission(String id, String title, int target, int reward) {
    }

    /** slot: 꾸미기가 끼워지는 자리 (top 꼭대기 · base 받침판 · bg 배경). 자리마다 하나만 쓸 수 있어요. 쓰는 물건(방어권 등)은 null */
    public record Item(String id, String name, String desc, int price, String slot) {
        public boolean look() {
            return slot != null;
        }
    }

    static final Mission TALK = new Mission("talk", "대화 1개 끝내기", 1, 10);
    static final List<Mission> ROTATE = List.of(
            new Mission("review", "단어 5개 복습하기", 5, 10),
            new Mission("straight", "비뚤어진 브릭 없이 탑 쌓기", 1, 15),
            new Mission("newplace", "처음 가 보는 장소에서 대화하기", 1, 15),
            new Mission("fix", "고칠 곳 1곳 고치기", 1, 10),
            new Mission("meet", "다시 만날 사람 1명 만나기", 1, 15));
    static final Mission WEEK = new Mission("week5", "이번 주 공부한 날 5일 채우기", 5, 50);

    public static final List<Item> ITEMS = List.of(
            new Item("shield", "브릭 방어권", "쉬다가 탑에 금이 가려는 날, 저절로 1번 막아 줘요", 30, null),
            new Item("rest", "쉬어가기권", "고른 하루는 금도 안 가고 떨어지지도 않아요", 40, null),
            // 꼭대기 장식 (concept 11-38)
            new Item("flag", "꼭대기 깃발", "내 탑 맨 위에 깃발을 꽂아요", 60, "top"),
            new Item("lantern", "꼭대기 초롱", "내 탑 맨 위에 빨간 초롱을 달아요", 80, "top"),
            new Item("sakura", "벚꽃 가지", "내 탑 맨 위에 벚꽃 가지를 꽂아요", 90, "top"),
            new Item("umbrella", "종이우산", "내 탑 맨 위에 빨간 종이우산을 펼쳐요", 120, "top"),
            new Item("daruma", "다루마", "내 탑 맨 위에 다루마 인형을 올려요", 150, "top"),
            // 받침판
            new Item("tatami", "다다미 받침판", "내 탑 받침판이 다다미로 바뀌어요", 70, "base"),
            new Item("sakuraplate", "벚꽃 받침판", "내 탑 받침판이 벚꽃색으로 바뀌어요", 90, "base"),
            new Item("gold", "금빛 받침판", "내 탑 받침판이 금빛으로 바뀌어요", 100, "base"),
            // 배경
            new Item("petals", "꽃잎 배경", "내 탑 뒤로 벚꽃잎이 날려요", 150, "bg"),
            new Item("sunset", "노을 배경", "내 탑 뒤로 노을이 져요", 200, "bg"),
            new Item("night", "밤하늘 배경", "내 탑 뒤로 달과 별이 떠요", 250, "bg"));
    static final Map<String, Integer> CRACK_AFTER = Map.of("slow", 3, "normal", 2, "fast", 1);

    private final ShopMapper shop;
    private final TowerMapper tower;
    private final PrefController.PrefMapper prefs;

    public ShopService(ShopMapper shop, TowerMapper tower, PrefController.PrefMapper prefs) {
        this.shop = shop;
        this.tower = tower;
        this.prefs = prefs;
    }

    static List<Mission> today(LocalDate day) {
        long d = day.toEpochDay();
        Mission a = ROTATE.get((int) (d % ROTATE.size()));
        Mission b = ROTATE.get((int) ((d + 2) % ROTATE.size()));
        return List.of(TALK, a, b);
    }

    static LocalDate monday(LocalDate day) {
        return day.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
    }

    private int progress(String owner, String id, LocalDate day) {
        return switch (id) {
            case "talk" -> shop.finished(owner, day);
            case "review" -> shop.answered(owner, day);
            case "straight" -> shop.finishedStraight(owner, day);
            case "newplace" -> shop.newPlaces(owner, day);
            case "fix" -> shop.fixedOn(owner, day);
            case "meet" -> shop.metAgain(owner, day);
            case "week5" -> shop.daysSince(owner, monday(day));
            default -> 0;
        };
    }

    private static String reason(Mission m, LocalDate day) {
        return "m:" + m.id() + ":" + (m == WEEK ? monday(day) : day);
    }

    /** 상점·미션 화면 한 번에 */
    public Map<String, Object> state(String owner) {
        LocalDate day = Who.today();
        Set<String> claimed = new HashSet<>(shop.recentClaims(owner));
        List<Map<String, Object>> missions = new ArrayList<>();
        for (Mission m : today(day)) missions.add(row(owner, m, day, claimed, "day"));
        missions.add(row(owner, WEEK, day, claimed, "week"));
        Map<String, Map<String, Object>> inv = new HashMap<>();
        for (Map<String, Object> r : shop.inventory(owner)) inv.put(String.valueOf(r.get("item")), r);
        List<Map<String, Object>> items = new ArrayList<>();
        for (Item it : ITEMS) {
            Map<String, Object> r = inv.get(it.id());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", it.id());
            m.put("name", it.name());
            m.put("desc", it.desc());
            m.put("price", it.price());
            m.put("look", it.look());
            m.put("slot", it.slot());
            m.put("qty", r == null ? 0 : ((Number) r.get("qty")).intValue());
            m.put("equipped", r != null && Boolean.TRUE.equals(r.get("equipped")));
            items.add(m);
        }
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("bricks", shop.balance(owner));
        out.put("missions", missions);
        out.put("items", items);
        out.put("guardDays", shop.guardDays(owner));
        out.put("today", day.toString());
        return out;
    }

    private Map<String, Object> row(String owner, Mission m, LocalDate day, Set<String> claimed, String kind) {
        Map<String, Object> r = new LinkedHashMap<>();
        r.put("id", m.id());
        r.put("title", m.title());
        r.put("target", m.target());
        r.put("reward", m.reward());
        r.put("kind", kind);
        r.put("n", Math.min(m.target(), progress(owner, m.id(), day)));
        r.put("claimed", claimed.contains(reason(m, day)));
        return r;
    }

    @Transactional
    public Map<String, Object> claim(String owner, String id) {
        LocalDate day = Who.today();
        Mission m = WEEK.id().equals(id) ? WEEK : today(day).stream().filter(x -> x.id().equals(id)).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "오늘 미션이 아니에요."));
        if (progress(owner, m.id(), day) < m.target()) throw new ApiException(HttpStatus.BAD_REQUEST, "아직 다 하지 않았어요.");
        if (shop.log(owner, m.reward(), reason(m, day)) == 0) throw new ApiException(HttpStatus.CONFLICT, "이미 받았어요.");
        shop.addBricks(owner, m.reward());
        return state(owner);
    }

    @Transactional
    public Map<String, Object> buy(String owner, String id) {
        Item it = ITEMS.stream().filter(x -> x.id().equals(id)).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "물건을 찾지 못했어요."));
        int bricks = shop.lockBalance(owner);
        if (it.look() && shop.inventory(owner).stream().anyMatch(r -> it.id().equals(r.get("item")) && ((Number) r.get("qty")).intValue() > 0)) {
            throw new ApiException(HttpStatus.CONFLICT, "이미 가지고 있어요.");
        }
        if (bricks < it.price()) throw new ApiException(HttpStatus.BAD_REQUEST, "브릭이 모자라요.");
        shop.addBricks(owner, -it.price());
        shop.log(owner, -it.price(), "buy:" + it.id());
        if (it.look()) offSlot(owner, it);
        shop.addItem(owner, it.id(), 1, it.look());
        return state(owner);
    }

    /** 같은 자리(꼭대기·받침판·배경)에 쓰던 꾸미기를 빼요 */
    private void offSlot(String owner, Item it) {
        List<String> same = ITEMS.stream().filter(x -> it.slot().equals(x.slot()) && !x.id().equals(it.id())).map(Item::id).toList();
        shop.unequip(owner, same);
    }

    /** 쉬어가기권 쓰기: 오늘부터 14일 안의 하루 */
    @Transactional
    public Map<String, Object> useRest(String owner, LocalDate day) {
        LocalDate today = Who.today();
        if (day == null || day.isBefore(today) || day.isAfter(today.plusDays(14))) throw new ApiException(HttpStatus.BAD_REQUEST, "오늘부터 14일 안에서 골라 주세요.");
        if (shop.guardDays(owner).stream().anyMatch(g -> day.toString().equals(g.get("day")))) throw new ApiException(HttpStatus.CONFLICT, "그날은 이미 쉬어가는 날이에요.");
        if (shop.useOne(owner, "rest") == 0) throw new ApiException(HttpStatus.BAD_REQUEST, "쉬어가기권이 없어요.");
        shop.guard(owner, day, "rest");
        return state(owner);
    }

    @Transactional
    public Map<String, Object> equip(String owner, String id, boolean on) {
        Item it = ITEMS.stream().filter(x -> x.id().equals(id) && x.look()).findFirst()
                .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "꾸미기 물건이 아니에요."));
        if (on && shop.inventory(owner).stream().noneMatch(r -> id.equals(r.get("item")) && ((Number) r.get("qty")).intValue() > 0)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "가지고 있지 않아요.");
        }
        if (on) offSlot(owner, it); // 같은 자리에 있던 꾸미기는 빼요
        if (shop.equip(owner, id, on) == 0) throw new ApiException(HttpStatus.BAD_REQUEST, "가지고 있지 않아요.");
        return state(owner);
    }

    /**
     * 방어권 저절로 쓰기: 마지막으로 공부한(또는 지켜진) 날 다음부터 어제까지 쉰 날이
     * 금이 갈 만큼(쌓는 속도의 crackAfter) 이어지면, 금이 가는 바로 그날을 방어권으로 지켜요
     */
    @Transactional
    public void applyShields(String owner) {
        List<String> active = tower.activeDays(owner);
        if (active.isEmpty()) return;
        int shields = shop.inventory(owner).stream().filter(r -> "shield".equals(r.get("item")))
                .mapToInt(r -> ((Number) r.get("qty")).intValue()).sum();
        if (shields <= 0) return;
        TreeSet<LocalDate> covered = new TreeSet<>();
        for (String d : active) covered.add(LocalDate.parse(d));
        for (Map<String, Object> g : shop.guardDays(owner)) covered.add(LocalDate.parse(String.valueOf(g.get("day"))));
        LocalDate yesterday = Who.today().minusDays(1);
        LocalDate last = covered.floor(yesterday);
        if (last == null) return;
        int crackAfter = CRACK_AFTER.getOrDefault(PrefController.speedOf(prefs, owner), 2);
        while (shields > 0) {
            LocalDate crackDay = last.plusDays(crackAfter);
            if (crackDay.isAfter(yesterday)) break;
            if (shop.useOne(owner, "shield") == 0) break;
            shop.guard(owner, crackDay, "shield");
            shields--;
            last = crackDay;
        }
    }

    public Map<String, Object> towerExtras(String owner) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("guardDays", shop.guardDays(owner));
        List<String> looks = new ArrayList<>();
        int shields = 0;
        for (Map<String, Object> r : shop.inventory(owner)) {
            if (Boolean.TRUE.equals(r.get("equipped")) && ((Number) r.get("qty")).intValue() > 0) looks.add(String.valueOf(r.get("item")));
            if ("shield".equals(r.get("item"))) shields = ((Number) r.get("qty")).intValue();
        }
        m.put("looks", looks);
        m.put("shields", shields);
        return m;
    }

    /** 가입·로그인: 둘러보기(v:)의 브릭·물건·지켜진 날을 계정(u:)으로 */
    @Transactional
    public void claimOwner(String from, String to) {
        shop.mergeWallet(from, to);
        shop.deleteWallet(from);
        shop.moveLog(from, to);
        shop.deleteLog(from);
        shop.mergeInventory(from, to);
        shop.deleteInventory(from);
        shop.copyGuards(from, to);
        shop.deleteGuards(from);
    }

    @Transactional
    public void deleteOwner(String owner) {
        shop.deleteWallet(owner);
        shop.deleteLog(owner);
        shop.deleteInventory(owner);
        shop.deleteGuards(owner);
    }
}
