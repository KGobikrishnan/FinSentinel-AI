package com.finsentinel.ledger;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface JournalEntryRepository extends JpaRepository<JournalEntry, Long> {

    Optional<JournalEntry> findByEntryNumber(String entryNumber);

    List<JournalEntry> findTop50ByOrderByPostingDateDescIdDesc();

    Page<JournalEntry> findAllByOrderByPostingDateDescIdDesc(Pageable pageable);

    List<JournalEntry> findByPostingDateBetweenOrderByPostingDateAsc(LocalDate startDate, LocalDate endDate);

    boolean existsByReferenceId(String referenceId);
}
