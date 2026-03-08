package com.vibesync.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.ExchangeStrategies;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {

    /**
     * General-purpose WebClient builder pre-configured with a 10 MB buffer
     * limit for image payloads forwarded to the AI service.
     */
    @Bean
    public WebClient.Builder webClientBuilder() {
        final int bufferSize = 10 * 1024 * 1024; // 10 MB
        return WebClient.builder()
                .exchangeStrategies(ExchangeStrategies.builder()
                        .codecs(cfg -> cfg.defaultCodecs().maxInMemorySize(bufferSize))
                        .build());
    }
}
