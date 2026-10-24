package com.billease.common.exception;

/** Thrown when the user is not logged in or the login details are wrong. Becomes HTTP 401. */
public class UnauthorizedException extends RuntimeException {

    public UnauthorizedException(String message) {
        super(message);
    }
}
