package com.oracyblock.user;

import com.oracyblock.common.ApiException;
import com.oracyblock.common.RateLimiter;
import com.oracyblock.common.Who;
import com.oracyblock.security.JwtTokenProvider;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.Locale;
import java.util.Map;

/** 가입·로그인 (이메일 + 비밀번호). 성공하면 이 기기의 기록을 계정으로 옮겨요 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private static final long HOUR = 3_600_000L;
    private static final long MIN15 = 900_000L;

    private final UserMapper users;
    private final UserService service;
    private final PasswordEncoder encoder;
    private final JwtTokenProvider jwt;
    private final RateLimiter limiter;

    public AuthController(UserMapper users, UserService service, PasswordEncoder encoder, JwtTokenProvider jwt, RateLimiter limiter) {
        this.users = users;
        this.service = service;
        this.encoder = encoder;
        this.jwt = jwt;
        this.limiter = limiter;
    }

    public record SignupRequest(String nickname, String email, String password) {
    }

    public record LoginRequest(String email, String password) {
    }

    @PostMapping("/signup")
    @Transactional
    public Map<String, Object> signup(@RequestBody SignupRequest body, HttpServletRequest req) {
        String ip = Who.clientIp(req);
        limiter.check("signup:" + ip, 20, HOUR, "가입을 너무 많이 했어요. 한 시간 뒤에 다시 해 주세요.");
        String email = cleanEmail(body.email());
        String nickname = UserService.cleanNickname(body.nickname());
        if (body.password() == null || body.password().length() < 8 || body.password().length() > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상으로 적어 주세요.");
        }
        if (users.findByEmail(email) != null) throw new ApiException(HttpStatus.CONFLICT, "이미 가입한 이메일이에요. 로그인해 주세요.");
        if (users.nicknameTaken(nickname, -1)) throw new ApiException(HttpStatus.CONFLICT, "이미 누가 쓰는 닉네임이에요. 다른 이름을 골라 주세요.");
        UserMapper.NewUser u = new UserMapper.NewUser(email, encoder.encode(body.password()), nickname, "USER");
        users.insert(u);
        limiter.record("signup:" + ip);
        return done(u.id, req);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody LoginRequest body, HttpServletRequest req) {
        String ip = Who.clientIp(req);
        String email = cleanEmail(body.email());
        String msg = "잠깐 쉬었다가 15분 뒤에 다시 해 주세요.";
        limiter.check("login:" + email, 10, MIN15, msg);
        limiter.check("login-ip:" + ip, 30, MIN15, msg);
        Map<String, Object> u = users.findByEmail(email);
        if (u == null || body.password() == null || !encoder.matches(body.password(), (String) u.get("passwordHash"))) {
            limiter.record("login:" + email);
            limiter.record("login-ip:" + ip);
            throw new ApiException(HttpStatus.UNAUTHORIZED, "이메일이나 비밀번호가 맞지 않아요.");
        }
        limiter.clear("login:" + email);
        return done(((Number) u.get("id")).longValue(), req);
    }

    private Map<String, Object> done(long userId, HttpServletRequest req) {
        service.claim(Who.of(null, req).visitorId(), userId);
        users.touch(userId);
        Map<String, Object> u = service.get(userId);
        return Map.of("token", jwt.create(userId, (String) u.get("role")), "user", UserService.view(u));
    }

    static String cleanEmail(String raw) {
        String e = raw == null ? "" : raw.strip().toLowerCase(Locale.ROOT);
        if (e.length() > 200 || !e.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "이메일을 다시 확인해 주세요.");
        }
        return e;
    }
}
