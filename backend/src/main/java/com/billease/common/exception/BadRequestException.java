package com.billease.common.exception;

/** Thrown when a business rule is broken (e.g. not enough stock). Becomes HTTP 400. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
