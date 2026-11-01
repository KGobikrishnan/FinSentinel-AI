package com.finsentinel.config;

import org.redisson.Redisson;
import org.redisson.api.RedissonClient;
import org.redisson.config.Config;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RedissonConfig {

    private static final Logger log = LoggerFactory.getLogger(RedissonConfig.class);

    @Value("${REDIS_HOST:localhost}")
    private String redisHost;

    @Value("${REDIS_PORT:6379}")
    private int redisPort;

    @Value("${REDIS_PASSWORD:}")
    private String redisPassword;

    @Bean(destroyMethod = "shutdown")
    @ConditionalOnMissingBean(RedissonClient.class)
    public RedissonClient redissonClient() {
        Config config = new Config();
        String address = String.format("redis://%s:%d", redisHost, redisPort);
        log.info("Initializing Redisson Client connection to {}", address);

        var singleServerConfig = config.useSingleServer()
                .setAddress(address)
                .setConnectionPoolSize(64)
                .setConnectionMinimumIdleSize(16)
                .setConnectTimeout(10000)
                .setTimeout(3000)
                .setRetryAttempts(3)
                .setRetryInterval(1500);

        if (redisPassword != null && !redisPassword.isBlank() && !"null".equalsIgnoreCase(redisPassword)) {
            singleServerConfig.setPassword(redisPassword);
        }

        return Redisson.create(config);
    }
}
