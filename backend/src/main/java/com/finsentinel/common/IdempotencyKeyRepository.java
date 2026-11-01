package com.finsentinel.common;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.Optional;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, String> {

    Optional<IdempotencyKey> findByIdempotencyKeyAndExpiresAtAfter(String key, OffsetDateTime now);

    void deleteByExpiresAtBefore(OffsetDateTime now);
}
