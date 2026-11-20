package com.oracyblock.user;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.Who;
import com.oracyblock.shop.ShopService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class UserService {

    private final UserMapper users;
    private final ShopService shop;

    public UserService(UserMapper users, ShopService shop) {
        this.users = users;
        this.shop = shop;
    }

    /** 화면에 돌려줄 내 정보 (비밀번호는 빼고) */
    public static Map<String, Object> view(Map<String, Object> u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.get("id"));
        m.put("email", u.get("email"));
        m.put("nickname", u.get("nickname"));
        m.put("role", u.get("role"));
        m.put("level", u.get("level"));
        m.put("createdAt", u.get("createdAt"));
        return m;
    }

    public Map<String, Object> get(long id) {
        Map<String, Object> u = users.findById(id);
        if (u == null) throw new ApiException(HttpStatus.UNAUTHORIZED, "계정을 찾지 못했어요. 다시 로그인해 주세요.");
        return u;
    }

    /** 가입하지 않고 이 기기에서 한 대화·단어·고칠 곳을 계정으로 옮겨요 */
    @Transactional
    public void claim(String visitorId, long userId) {
        String from = "v:" + visitorId;
        String to = "u:" + userId;
        users.movePlays(from, to, userId);
        users.moveFixes(from, to);
        users.copyWords(from, to);
        users.deleteWords(from);
        users.moveAnswers(from, to);
        users.copyPref(from, to);
        users.deletePref(from);
        users.linkVisit(visitorId, Who.today(), userId);
        shop.claimOwner(from, to);
    }

    @Transactional
    public void delete(long userId) {
        String owner = new Who(userId, "").owner();
        users.deleteWords(owner);
        users.deleteAnswers(owner);
        users.deleteFixes(owner);
        users.deletePref(owner);
        shop.deleteOwner(owner);
        users.delete(userId); // 대화 기록은 함께 지워짐 (ON DELETE CASCADE)
    }

    public static String cleanNickname(String raw) {
        String n = raw == null ? "" : raw.strip().replaceAll("\\s+", " ");
        if (n.length() < 2 || n.length() > 12) throw new ApiException(HttpStatus.BAD_REQUEST, "닉네임은 2~12자로 적어 주세요.");
        if (n.matches(".*[<>\"'`].*")) throw new ApiException(HttpStatus.BAD_REQUEST, "닉네임에 쓸 수 없는 글자가 있어요.");
        return n;
    }
}
