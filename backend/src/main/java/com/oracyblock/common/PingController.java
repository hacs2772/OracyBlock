package com.oracyblock.common;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Select;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/** 사이트 감시용 (docs/deploy.md "사이트가 꺼지면 알림"). 서버와 DB가 모두 살아 있어야 ok */
@RestController
public class PingController {
    @Mapper
    public interface PingMapper {
        @Select("SELECT 1")
        int one();
    }

    private final PingMapper ping;

    public PingController(PingMapper ping) {
        this.ping = ping;
    }

    @GetMapping("/api/v1/ping")
    public Map<String, Object> ping() {
        return Map.of("ok", ping.one() == 1);
    }
}
