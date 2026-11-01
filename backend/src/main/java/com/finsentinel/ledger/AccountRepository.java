package com.finsentinel.ledger;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {

    Optional<Account> findByCode(String code);

    List<Account> findByAccountType(AccountType accountType);

    List<Account> findByActiveTrueOrderByCodeAsc();

    @Query("SELECT a FROM Account a ORDER BY a.code ASC")
    List<Account> findAllOrderedByCode();
}
