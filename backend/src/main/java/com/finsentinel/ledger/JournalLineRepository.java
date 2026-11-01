package com.finsentinel.ledger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface JournalLineRepository extends JpaRepository<JournalLine, Long> {

    List<JournalLine> findByAccountId(Long accountId);

    @Query("SELECT COALESCE(SUM(jl.amount), 0) FROM JournalLine jl WHERE jl.account.id = :accountId AND jl.entryType = :entryType")
    BigDecimal sumAmountByAccountIdAndEntryType(@Param("accountId") Long accountId, @Param("entryType") EntryType entryType);
}
