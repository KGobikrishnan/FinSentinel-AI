package com.finsentinel.config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AiConfig {

    @Bean
    @ConditionalOnBean(ChatModel.class)
    public ChatClient chatClient(ChatModel chatModel) {
        return ChatClient.builder(chatModel)
                .defaultSystem("""
                        You are FinSentinel AI, an Enterprise Autonomous FinOps Copilot and Lead Forensic Auditor.
                        Provide precise, mathematically verified, GAAP/IFRS compliant financial guidance.
                        When answering, cite ledger invariants, procurement policies, and compute precise balances.
                        """)
                .build();
    }
}
