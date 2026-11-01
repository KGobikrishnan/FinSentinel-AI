package com.finsentinel.common;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.finsentinel.auth.User;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.OffsetDateTime;

@Aspect
@Component
@RequiredArgsConstructor
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    @Around("@annotation(auditedAction)")
    public Object auditMethod(ProceedingJoinPoint joinPoint, AuditedAction auditedAction) throws Throwable {
        String userId = "ANONYMOUS";
        String userRole = "ROLE_ANONYMOUS";

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof User user) {
            userId = user.getUsername();
            userRole = user.getRole().name();
        } else if (auth != null && auth.getName() != null) {
            userId = auth.getName();
        }

        String ipAddress = "0.0.0.0";
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isBlank()) {
                    ipAddress = xForwardedFor.split(",")[0].trim();
                } else {
                    ipAddress = request.getRemoteAddr();
                }
            }
        } catch (Exception e) {
            log.trace("Could not resolve client IP address: {}", e.getMessage());
        }

        String beforeState = null;
        Object[] args = joinPoint.getArgs();
        if (args != null && args.length > 0) {
            try {
                beforeState = objectMapper.writeValueAsString(args[0]);
            } catch (Exception e) {
                beforeState = "{\"arg\":\"unserializable\"}";
            }
        }

        Object result;
        try {
            result = joinPoint.proceed();
        } catch (Throwable t) {
            // Log failure audit entry
            try {
                AuditLog failedLog = AuditLog.builder()
                        .userId(userId)
                        .userRole(userRole)
                        .action(auditedAction.action() + "_FAILED")
                        .targetEntity(auditedAction.entity())
                        .targetId("ERROR")
                        .beforeState(beforeState)
                        .afterState(objectMapper.writeValueAsString(java.util.Map.of("error", t.getMessage())))
                        .ipAddress(ipAddress)
                        .timestamp(OffsetDateTime.now())
                        .build();
                auditLogRepository.save(failedLog);
            } catch (Exception ex) {
                log.error("Failed to persist failure audit log", ex);
            }
            throw t;
        }

        String afterState = null;
        String targetId = null;
        try {
            if (result != null) {
                afterState = objectMapper.writeValueAsString(result);
                // Attempt to infer ID if present in result map or DTO
                if (afterState.contains("\"id\":")) {
                    int idx = afterState.indexOf("\"id\":") + 5;
                    int endIdx = afterState.indexOf(",", idx);
                    if (endIdx == -1) endIdx = afterState.indexOf("}", idx);
                    if (endIdx != -1) {
                        targetId = afterState.substring(idx, endIdx).replaceAll("[^0-9a-zA-Z_-]", "");
                    }
                }
            }
        } catch (Exception e) {
            afterState = "{\"result\":\"unserializable\"}";
        }

        try {
            AuditLog successLog = AuditLog.builder()
                    .userId(userId)
                    .userRole(userRole)
                    .action(auditedAction.action())
                    .targetEntity(auditedAction.entity())
                    .targetId(targetId != null ? targetId : "N/A")
                    .beforeState(beforeState)
                    .afterState(afterState)
                    .ipAddress(ipAddress)
                    .timestamp(OffsetDateTime.now())
                    .build();
            auditLogRepository.save(successLog);
        } catch (Exception e) {
            log.error("Failed to save audit log entry", e);
        }

        return result;
    }
}
