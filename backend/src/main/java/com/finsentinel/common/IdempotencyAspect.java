package com.finsentinel.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.redisson.api.RLock;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.lang.reflect.Type;
import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.concurrent.TimeUnit;

@Aspect
@Component
@RequiredArgsConstructor
public class IdempotencyAspect {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyAspect.class);
    private static final String IDEMPOTENCY_HEADER = "Idempotency-Key";

    private final RedissonClient redissonClient;
    private final IdempotencyKeyRepository idempotencyKeyRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(idempotent)")
    public Object handleIdempotency(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        String idempotencyKey = request.getHeader(IDEMPOTENCY_HEADER);

        // If no idempotency header is provided, proceed without caching
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return joinPoint.proceed();
        }

        String lockKey = "lock:idempotency:" + idempotencyKey;
        RLock lock = redissonClient.getLock(lockKey);

        boolean acquired = false;
        try {
            acquired = lock.tryLock(5, 30, TimeUnit.SECONDS);
            if (!acquired) {
                throw new IdempotencyException(idempotencyKey,
                        "Concurrent request with Idempotency-Key '" + idempotencyKey + "' is currently being processed.");
            }

            OffsetDateTime now = OffsetDateTime.now();
            Optional<IdempotencyKey> existing = idempotencyKeyRepository.findByIdempotencyKeyAndExpiresAtAfter(idempotencyKey, now);

            if (existing.isPresent()) {
                IdempotencyKey record = existing.get();
                if ("COMPLETED".equals(record.getStatus())) {
                    log.info("Idempotent replay detected for key {}. Returning cached payload.", idempotencyKey);
                    MethodSignature signature = (MethodSignature) joinPoint.getSignature();
                    Class<?> returnType = signature.getReturnType();

                    if (ResponseEntity.class.isAssignableFrom(returnType)) {
                        Type genericReturnType = signature.getMethod().getGenericReturnType();
                        Object body = objectMapper.readValue(record.getResponsePayload(), Object.class);
                        return ResponseEntity.status(record.getResponseStatus() != null ? record.getResponseStatus() : 200).body(body);
                    } else {
                        return objectMapper.readValue(record.getResponsePayload(), returnType);
                    }
                } else if ("IN_PROGRESS".equals(record.getStatus())) {
                    throw new IdempotencyException(idempotencyKey,
                            "Request with Idempotency-Key '" + idempotencyKey + "' is already in progress.");
                }
            }

            // Record IN_PROGRESS
            IdempotencyKey inProgressRecord = IdempotencyKey.builder()
                    .idempotencyKey(idempotencyKey)
                    .status("IN_PROGRESS")
                    .createdAt(now)
                    .expiresAt(now.plusSeconds(idempotent.expireSeconds()))
                    .build();
            idempotencyKeyRepository.save(inProgressRecord);

            // Execute target method
            Object result = joinPoint.proceed();

            // Store COMPLETED record
            String responsePayload = objectMapper.writeValueAsString(result);
            int statusCode = 200;
            if (result instanceof ResponseEntity<?> responseEntity) {
                statusCode = responseEntity.getStatusCode().value();
                responsePayload = objectMapper.writeValueAsString(responseEntity.getBody());
            }

            inProgressRecord.setStatus("COMPLETED");
            inProgressRecord.setResponsePayload(responsePayload);
            inProgressRecord.setResponseStatus(statusCode);
            idempotencyKeyRepository.save(inProgressRecord);

            return result;

        } catch (Throwable t) {
            if (!(t instanceof IdempotencyException)) {
                try {
                    idempotencyKeyRepository.deleteById(idempotencyKey);
                } catch (Exception ex) {
                    log.error("Failed to clean up idempotency key on failure", ex);
                }
            }
            throw t;
        } finally {
            if (acquired && lock.isHeldByCurrentThread()) {
                lock.unlock();
            }
        }
    }
}
