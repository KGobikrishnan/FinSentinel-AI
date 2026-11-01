package com.finsentinel.common;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findTop50ByOrderByTimestampDesc();

    Page<AuditLog> findByTargetEntityOrderByTimestampDesc(String targetEntity, Pageable pageable);

    Page<AuditLog> findByUserIdOrderByTimestampDesc(String userId, Pageable pageable);
}
