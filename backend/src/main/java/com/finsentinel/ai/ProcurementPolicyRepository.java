package com.finsentinel.ai;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProcurementPolicyRepository extends JpaRepository<ProcurementPolicy, Long> {

    Optional<ProcurementPolicy> findByPolicyCode(String policyCode);

    List<ProcurementPolicy> findAllByOrderByPolicyCodeAsc();
}
