package com.vibesync.backend.service;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import com.vibesync.backend.dto.VibeAnalysisResult;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientRequestException;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.io.IOException;
import java.time.Duration;
import java.util.List;

/**
 * Communicates with the Python FastAPI AI microservice to translate
 * multi-modal inputs into Spotify-compatible musical parameters.
 */
@Service
@Slf4j
public class VibeService {

    private final WebClient webClient;

    public VibeService(
            WebClient.Builder webClientBuilder,
            @Value("${vibesync.ai-service.base-url}") String aiBaseUrl) {
        this.webClient = webClientBuilder.baseUrl(aiBaseUrl).build();
    }

    /**
     * Sends an image and/or text prompt to the AI service and returns the
     * parsed musical parameters.
     *
     * @param image  optional image file depicting a mood
     * @param prompt optional textual vibe description
     * @return structured vibe analysis result
     */
    public VibeAnalysisResult analyzeVibe(MultipartFile image, String prompt) {
        MultipartBodyBuilder bodyBuilder = new MultipartBodyBuilder();

        // Attach image bytes if provided
        if (image != null && !image.isEmpty()) {
            try {
                byte[] imageBytes = image.getBytes();
                bodyBuilder.part("image", new ByteArrayResource(imageBytes) {
                    @Override
                    public String getFilename() {
                        return image.getOriginalFilename();
                    }
                }).contentType(MediaType.parseMediaType(
                        image.getContentType() != null ? image.getContentType() : "image/jpeg"));
            } catch (IOException e) {
                log.error("Failed to read uploaded image bytes", e);
                throw new RuntimeException("Could not process the uploaded image.", e);
            }
        }

        // Attach text prompt if provided
        if (prompt != null && !prompt.isBlank()) {
            bodyBuilder.part("prompt", prompt);
        }

        log.info("Sending vibe analysis request — image={}, prompt={}",
                image != null && !image.isEmpty(), prompt != null);

        try {
            /*
             * The Python service uses snake_case JSON keys (target_tempo),
             * so we use a raw intermediate DTO for deserialization then
             * map it to our camelCase VibeAnalysisResult.
             */
            AiServiceResponse raw = webClient.post()
                    .uri("/api/v1/analyze-vibe")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(bodyBuilder.build()))
                    .retrieve()
                    .bodyToMono(AiServiceResponse.class)
                    .timeout(Duration.ofSeconds(120))
                    .block();

            if (raw == null) {
                throw new RuntimeException("AI service returned an empty response.");
            }

            return new VibeAnalysisResult(raw.getGenres(), raw.getTargetTempo(), raw.getEnergy(), raw.getValence());

        } catch (WebClientRequestException ex) {
            log.error("AI microservice is unreachable: {}", ex.getMessage());
            throw new RuntimeException(
                    "The AI microservice is not reachable at the configured URL. "
                    + "Ensure the FastAPI service is running on localhost:8000.", ex);
        } catch (WebClientResponseException ex) {
            log.error("AI microservice error — HTTP {}: {}", ex.getStatusCode(), ex.getResponseBodyAsString());
            throw new RuntimeException(
                    "The AI microservice returned an error: " + ex.getStatusCode(), ex);
        }
    }

    /**
     * Intermediate DTO matching the Python service's snake_case JSON contract.
     */
    @Data
    @JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
    private static class AiServiceResponse {
        private List<String> genres;
        private int targetTempo;
        private double energy;
        private double valence;
    }
}
