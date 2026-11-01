package com.finsentinel.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class IdempotencyException extends RuntimeException {

    private final String key;

    public IdempotencyException(String key, String message) {
        super(message);
        this.key = key;
    }

    public String getKey() {
        return key;
    }
}
