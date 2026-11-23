package com.oracyblock.user;

import com.oracyblock.config.AppProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;

/** 켜질 때 .env 의 ADMIN_EMAIL / ADMIN_PASSWORD 로 관리자 계정을 만들거나 비밀번호를 맞춰요 */
@Component
public class AdminAccountInitializer implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(AdminAccountInitializer.class);

    private final AppProperties props;
    private final UserMapper users;
    private final PasswordEncoder encoder;

    public AdminAccountInitializer(AppProperties props, UserMapper users, PasswordEncoder encoder) {
        this.props = props;
        this.users = users;
        this.encoder = encoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        AppProperties.Admin a = props.admin();
        if (a == null || a.email() == null || a.email().isBlank() || a.password() == null || a.password().isBlank()) {
            log.info("관리자 계정 설정이 없어서 건너뛰어요 (ADMIN_EMAIL / ADMIN_PASSWORD)");
            return;
        }
        if (a.password().length() < 10) {
            log.warn("ADMIN_PASSWORD 가 10자보다 짧아서 관리자 계정을 만들지 않았어요.");
            return;
        }
        String email = a.email().strip().toLowerCase(Locale.ROOT);
        Map<String, Object> u = users.findByEmail(email);
        String hash = encoder.encode(a.password());
        if (u == null) {
            String nick = a.nickname() == null || a.nickname().isBlank() ? "운영자" : a.nickname().strip();
            if (users.nicknameTaken(nick, -1)) nick = nick + "1";
            UserMapper.NewUser nu = new UserMapper.NewUser(email, hash, nick, "ADMIN");
            users.insert(nu);
            log.info("관리자 계정을 만들었어요: {}", email);
        } else {
            users.makeAdmin(((Number) u.get("id")).longValue(), hash);
            log.info("관리자 계정 비밀번호를 .env 와 맞췄어요: {}", email);
        }
    }
}
