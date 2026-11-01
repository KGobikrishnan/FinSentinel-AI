package com.finsentinel.auth;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.UUID;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";
    private static final String REFRESH_TOKEN_PREFIX = "jwt:refresh:";

    private final SecretKey secretKey;
    private final long accessTokenExpirationMs;
    private final long refreshTokenExpirationMs;
    private final RedissonClient redissonClient;

    public JwtService(
            @Value("${finsentinel.jwt.secret}") String secret,
            @Value("${finsentinel.jwt.access-token-expiration-ms:900000}") long accessTokenExpirationMs,
            @Value("${finsentinel.jwt.refresh-token-expiration-ms:604800000}") long refreshTokenExpirationMs,
            RedissonClient redissonClient) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.accessTokenExpirationMs = accessTokenExpirationMs;
        this.refreshTokenExpirationMs = refreshTokenExpirationMs;
        this.redissonClient = redissonClient;
    }

    public String generateAccessToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(accessTokenExpirationMs);
        String jti = UUID.randomUUID().toString();

        return Jwts.builder()
                .id(jti)
                .subject(user.getUsername())
                .claim("role", user.getRole().name())
                .claim("fullName", user.getFullName())
                .claim("email", user.getEmail())
                .issuedAt(Date.from(now))
                .expiration(Date.from(expiry))
                .signWith(secretKey)
                .compact();
    }

    public String generateRefreshToken(User user) {
        Instant now = Instant.now();
        Instant expiry = now.plusMillis(refreshTokenExpirationMs);
        String refreshToken = UUID.randomUUID().toString();

        // Store refresh token in Redis with TTL
        String redisKey = REFRESH_TOKEN_PREFIX + user.getUsername();
        RBucket<String> bucket = redissonClient.getBucket(redisKey);
        bucket.set(refreshToken, Duration.ofMillis(refreshTokenExpirationMs));

        log.debug("Stored refresh token for user {} with TTL {}ms", user.getUsername(), refreshTokenExpirationMs);
        return refreshToken;
    }

    public boolean validateRefreshToken(String username, String refreshToken) {
        String redisKey = REFRESH_TOKEN_PREFIX + username;
        RBucket<String> bucket = redissonClient.getBucket(redisKey);
        String storedToken = bucket.get();
        return storedToken != null && storedToken.equals(refreshToken);
    }

    public void revokeRefreshToken(String username) {
        String redisKey = REFRESH_TOKEN_PREFIX + username;
        redissonClient.getBucket(redisKey).delete();
    }

    public void blacklistToken(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Date expiration = claims.getExpiration();
            long remainingMs = expiration.getTime() - System.currentTimeMillis();
            if (remainingMs > 0) {
                String tokenId = claims.getId() != null ? claims.getId() : token;
                RBucket<String> blacklistBucket = redissonClient.getBucket(BLACKLIST_PREFIX + tokenId);
                blacklistBucket.set("revoked", Duration.ofMillis(remainingMs));
                log.info("Blacklisted token {} for {}ms", tokenId, remainingMs);
            }
        } catch (JwtException e) {
            log.warn("Attempted to blacklist an invalid or expired token: {}", e.getMessage());
        }
    }

    public boolean isTokenBlacklisted(String token) {
        try {
            Claims claims = extractAllClaims(token);
            String tokenId = claims.getId() != null ? claims.getId() : token;
            RBucket<String> bucket = redissonClient.getBucket(BLACKLIST_PREFIX + tokenId);
            return bucket.isExists();
        } catch (Exception e) {
            return true;
        }
    }

    public String extractUsername(String token) {
        return extractAllClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return extractAllClaims(token).get("role", String.class);
    }

    public boolean isTokenValid(String token, User user) {
        try {
            if (isTokenBlacklisted(token)) {
                return false;
            }
            Claims claims = extractAllClaims(token);
            String username = claims.getSubject();
            boolean isExpired = claims.getExpiration().before(new Date());
            return username.equals(user.getUsername()) && !isExpired && user.isEnabled();
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public long getAccessTokenExpirationMs() {
        return accessTokenExpirationMs;
    }
}
