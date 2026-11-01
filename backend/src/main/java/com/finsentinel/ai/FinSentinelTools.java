package com.finsentinel.ai;

import com.finsentinel.ledger.Account;
import com.finsentinel.ledger.AccountRepository;
import com.finsentinel.ledger.AccountType;
import com.finsentinel.procurement.Invoice;
import com.finsentinel.procurement.InvoiceRepository;
import com.finsentinel.procurement.Vendor;
import com.finsentinel.procurement.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Description;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class FinSentinelTools {

    private final AccountRepository accountRepository;
    private final VendorRepository vendorRepository;
    private final InvoiceRepository invoiceRepository;

    private static final Pattern GSTIN_PATTERN = Pattern.compile("^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$");

    @Description("Fetches general ledger balance summary filtered by account type (ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE)")
    public Map<String, Object> getLedgerBalanceSummary(String accountType, String dateRange) {
        List<Account> accounts;
        if (accountType != null && !accountType.isBlank() && !"ALL".equalsIgnoreCase(accountType)) {
            try {
                AccountType type = AccountType.valueOf(accountType.toUpperCase());
                accounts = accountRepository.findByAccountType(type);
            } catch (IllegalArgumentException e) {
                accounts = accountRepository.findAllOrderedByCode();
            }
        } else {
            accounts = accountRepository.findAllOrderedByCode();
        }

        BigDecimal totalSum = BigDecimal.ZERO;
        List<Map<String, Object>> accountDetails = new ArrayList<>();

        for (Account acc : accounts) {
            totalSum = totalSum.add(acc.getBalance());
            Map<String, Object> item = new HashMap<>();
            item.put("code", acc.getCode());
            item.put("name", acc.getName());
            item.put("type", acc.getAccountType().name());
            item.put("balance", acc.getBalance());
            accountDetails.add(item);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("accountTypeFilter", accountType != null ? accountType : "ALL");
        response.put("totalCumulativeBalance", totalSum);
        response.put("accountCount", accounts.size());
        response.put("accounts", accountDetails);
        return response;
    }

    @Description("Retrieves the top corporate vendors ranked by total cumulative invoiced spend")
    public List<Map<String, Object>> getTopVendorsBySpend(Integer limit) {
        int max = (limit != null && limit > 0) ? limit : 5;
        List<Vendor> vendors = vendorRepository.findAllByOrderByTotalInvoicedDesc();

        return vendors.stream()
                .limit(max)
                .map(v -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", v.getId());
                    map.put("vendorName", v.getName());
                    map.put("gstin", v.getGstin());
                    map.put("riskTier", v.getRiskTier());
                    map.put("totalInvoiced", v.getTotalInvoiced());
                    map.put("historicalAvgUnitPrice", v.getHistoricalAvgUnitPrice());
                    map.put("verified", v.isVerified());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Description("Fetches high-risk or flagged procurement invoices exceeding the specified minimum fraud risk score")
    public List<Map<String, Object>> getFlaggedAnomalies(Integer minRiskScore) {
        int threshold = (minRiskScore != null) ? minRiskScore : 30;
        List<Invoice> invoices = invoiceRepository.findTop50ByOrderByCreatedAtDesc();

        return invoices.stream()
                .filter(i -> i.getFraudRiskScore() >= threshold)
                .map(i -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("invoiceId", i.getId());
                    map.put("invoiceNumber", i.getInvoiceNumber());
                    map.put("vendorName", i.getVendor().getName());
                    map.put("totalAmount", i.getTotalAmount());
                    map.put("fraudRiskScore", i.getFraudRiskScore());
                    map.put("triageStatus", i.getTriageStatus().name());
                    map.put("anomalyReasons", i.getAnomalyReasons());
                    map.put("date", i.getInvoiceDate());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @Description("Validates statutory GST compliance, registration validity, and risk tier for a given vendor GSTIN")
    public Map<String, Object> verifyGstCompliance(String vendorGstin) {
        Map<String, Object> result = new HashMap<>();
        if (vendorGstin == null || vendorGstin.isBlank()) {
            result.put("validGstinFormat", false);
            result.put("message", "No GSTIN provided for verification");
            return result;
        }

        String cleanGstin = vendorGstin.trim().toUpperCase();
        boolean formatValid = GSTIN_PATTERN.matcher(cleanGstin).matches();

        result.put("gstin", cleanGstin);
        result.put("validGstinFormat", formatValid);

        var vendorOpt = vendorRepository.findByGstin(cleanGstin);
        if (vendorOpt.isPresent()) {
            Vendor v = vendorOpt.get();
            result.put("vendorRegistered", true);
            result.put("vendorName", v.getName());
            result.put("riskTier", v.getRiskTier());
            result.put("isVerified", v.isVerified());
            result.put("taxId", v.getTaxId());
            result.put("status", formatValid && v.isVerified() ? "COMPLIANT" : "FLAGGED");
        } else {
            result.put("vendorRegistered", false);
            result.put("status", formatValid ? "UNREGISTERED_SUPPLIER" : "INVALID_GSTIN_STRUCTURE");
        }

        return result;
    }
}
