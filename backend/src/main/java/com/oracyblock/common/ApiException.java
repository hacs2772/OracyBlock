package com.oracyblock.common;

import org.springframework.http.HttpStatus;

/** 사용자에게 보여 줄 말과 함께 요청을 거절할 때 */
public class ApiException extends RuntimeException {
    private final HttpStatus status;

    public ApiException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
