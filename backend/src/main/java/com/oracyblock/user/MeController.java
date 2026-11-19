package com.oracyblock.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.oracyblock.common.ApiException;

import java.util.Map;

/** 내 정보 보기·바꾸기·탈퇴 (로그인 필요) */
@RestController
@RequestMapping("/api/v1/me")
public class MeController {

    private final UserMapper users;
    private final UserService service;

    public MeController(UserMapper users, UserService service) {
        this.users = users;
        this.service = service;
    }

    public record UpdateRequest(String nickname, Integer level) {
    }

    @GetMapping
    public Map<String, Object> me(@AuthenticationPrincipal Long userId) {
        users.touch(userId);
        return UserService.view(service.get(userId));
    }

    @PutMapping
    public Map<String, Object> update(@AuthenticationPrincipal Long userId, @RequestBody UpdateRequest body) {
        if (body.nickname() != null) {
            String n = UserService.cleanNickname(body.nickname());
            if (users.nicknameTaken(n, userId)) throw new ApiException(HttpStatus.CONFLICT, "이미 누가 쓰는 닉네임이에요.");
            users.updateNickname(userId, n);
        }
        if (body.level() != null) {
            if (body.level() < 1 || body.level() > 5) throw new ApiException(HttpStatus.BAD_REQUEST, "레벨은 1~5예요.");
            users.updateLevel(userId, body.level());
        }
        return UserService.view(service.get(userId));
    }

    @DeleteMapping
    public Map<String, Object> delete(@AuthenticationPrincipal Long userId) {
        service.delete(userId);
        return Map.of("ok", true);
    }
}
