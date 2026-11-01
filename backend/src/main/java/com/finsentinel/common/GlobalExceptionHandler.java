package com.finsentinel.common;

import com.finsentinel.ledger.UnbalancedLedgerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(UnbalancedLedgerException.class)
    public ProblemDetail handleUnbalancedLedger(UnbalancedLedgerException ex) {
        log.warn("Double-entry ledger invariant violation: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNPROCESSABLE_ENTITY, ex.getMessage());
        problem.setTitle("Unbalanced Ledger Invariant Violation");
        problem.setType(URI.create("https://finsentinel.ai/errors/unbalanced-ledger"));
        problem.setProperty("totalDebit", ex.getTotalDebit());
        problem.setProperty("totalCredit", ex.getTotalCredit());
        problem.setProperty("imbalance", ex.getImbalance());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(IdempotencyException.class)
    public ProblemDetail handleIdempotencyException(IdempotencyException ex) {
        log.warn("Idempotency conflict: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        problem.setTitle("Idempotency Conflict");
        problem.setType(URI.create("https://finsentinel.ai/errors/idempotency-conflict"));
        problem.setProperty("idempotencyKey", ex.getKey());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleResourceNotFound(ResourceNotFoundException ex) {
        log.debug("Resource not found: {}", ex.getMessage());
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        problem.setTitle("Resource Not Found");
        problem.setType(URI.create("https://finsentinel.ai/errors/not-found"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidationErrors(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed for request parameters");
        problem.setTitle("Validation Constraint Violation");
        problem.setType(URI.create("https://finsentinel.ai/errors/validation-failed"));
        problem.setProperty("fieldErrors", errors);
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, ex.getMessage());
        problem.setTitle("Authentication Failure");
        problem.setType(URI.create("https://finsentinel.ai/errors/bad-credentials"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Access is denied: insufficient role privileges");
        problem.setTitle("Access Denied");
        problem.setType(URI.create("https://finsentinel.ai/errors/access-denied"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, ex.getMessage());
        problem.setTitle("Invalid Request Argument");
        problem.setType(URI.create("https://finsentinel.ai/errors/bad-request"));
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }

    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unhandled internal server error", ex);
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected financial system error occurred");
        problem.setTitle("Internal Server Error");
        problem.setType(URI.create("https://finsentinel.ai/errors/internal-error"));
        problem.setProperty("errorMessage", ex.getMessage());
        problem.setProperty("timestamp", Instant.now());
        return problem;
    }
}
