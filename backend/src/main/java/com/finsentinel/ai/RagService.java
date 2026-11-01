package com.finsentinel.ai;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RagService {

    private static final Logger log = LoggerFactory.getLogger(RagService.class);

    private final ProcurementPolicyRepository policyRepository;

    @Autowired(required = false)
    private VectorStore vectorStore;

    public List<String> retrievePolicyContext(String query) {
        log.info("Executing RAG retrieval for query: {}", query);
        List<String> contexts = new ArrayList<>();

        // If VectorStore is active, query similarity
        if (vectorStore != null) {
            try {
                var docs = vectorStore.similaritySearch(query);
                if (docs != null && !docs.isEmpty()) {
                    for (var doc : docs) {
                        contexts.add(doc.getContent());
                    }
                }
            } catch (Exception e) {
                log.warn("Vector store query fallback due to: {}", e.getMessage());
            }
        }

        // If vector results are empty or vectorStore not active, retrieve policies from database
        if (contexts.isEmpty()) {
            List<ProcurementPolicy> allPolicies = policyRepository.findAllByOrderByPolicyCodeAsc();
            String lowerQuery = query.toLowerCase();

            for (ProcurementPolicy policy : allPolicies) {
                boolean matches = policy.getTitle().toLowerCase().contains(lowerQuery)
                        || policy.getDescription().toLowerCase().contains(lowerQuery)
                        || (lowerQuery.contains("policy") || lowerQuery.contains("gst") || lowerQuery.contains("variance") || lowerQuery.contains("threshold") || lowerQuery.contains("dual"));

                if (matches) {
                    contexts.add(String.format("[%s: %s] %s (Threshold: %s%%)",
                            policy.getPolicyCode(), policy.getTitle(), policy.getDescription(), policy.getThresholdPct()));
                }
            }

            // If query is broad, return all policies
            if (contexts.isEmpty()) {
                contexts = allPolicies.stream()
                        .map(p -> String.format("[%s: %s] %s", p.getPolicyCode(), p.getTitle(), p.getDescription()))
                        .collect(Collectors.toList());
            }
        }

        return contexts;
    }
}
