package com.vibesync.backend.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.reactive.function.client.WebClientRequestException;

import java.time.Instant;
import java.util.Map;

/**
 * Centralized exception handler that translates runtime errors into
 * clean, structured JSON responses for the Next.js frontend.
 */
@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        log.error("Unhandled runtime exception", ex);

        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String message = ex.getMessage();

        // AI microservice unreachable
        if (ex.getCause() instanceof WebClientRequestException) {
            status = HttpStatus.SERVICE_UNAVAILABLE;
            message = "The AI microservice is currently unavailable. Please ensure it is running.";
        }

        // Spotify rate limiting (429 propagated as RuntimeException)
        if (message != null && message.contains("429")) {
            status = HttpStatus.TOO_MANY_REQUESTS;
            message = "Spotify API rate limit exceeded. Please wait and try again.";
        }

        return ResponseEntity.status(status).body(Map.of(
                "error", status.getReasonPhrase(),
                "message", message != null ? message : "An unexpected error occurred.",
                "status", status.value(),
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(Map.of(
                "error", "Payload Too Large",
                "message", "The uploaded file exceeds the maximum allowed size.",
                "status", 413,
                "timestamp", Instant.now().toString()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                "error", "Bad Request",
                "message", ex.getMessage(),
                "status", 400,
                "timestamp", Instant.now().toString()
        ));
    }
}
