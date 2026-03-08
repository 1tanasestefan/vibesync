package com.vibesync.backend.controller;

import com.vibesync.backend.dto.PlaylistResponse;
import com.vibesync.backend.dto.VibeAnalysisResult;
import com.vibesync.backend.model.PlaylistHistory;
import com.vibesync.backend.repository.PlaylistHistoryRepository;
import com.vibesync.backend.service.SpotifyService;
import com.vibesync.backend.service.VibeService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.HttpStatus;

import java.time.Instant;
import java.util.List;
import java.util.Map;

/**
 * Primary REST controller for the VibeSync playlist generation workflow.
 *
 * Flow: Frontend → VibeController → VibeService (AI) → SpotifyService → Database
 */
@RestController
@RequestMapping("/api/vibe")
@RequiredArgsConstructor
@Slf4j
public class VibeController {

    private final VibeService vibeService;
    private final SpotifyService spotifyService;
    private final PlaylistHistoryRepository historyRepository;

    /**
     * POST /api/vibe/generate
     *
     * Accepts an optional image file and/or text prompt, runs AI analysis,
     * builds a Spotify playlist, persists the record, and returns the result.
     */
    @PostMapping(value = "/generate", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> generatePlaylist(
            @RequestPart(value = "image", required = false) MultipartFile image,
            @RequestPart(value = "prompt", required = false) String prompt,
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {

        // ── Validation ─────────────────────────────────────
        if ((image == null || image.isEmpty()) && (prompt == null || prompt.isBlank())) {
            return ResponseEntity.badRequest().build();
        }

        String effectivePrompt = prompt != null ? prompt : "Image-based vibe";
        try {
            // ── Validation ─────────────────────────────────────
            if ((image == null || image.isEmpty()) && (prompt == null || prompt.isBlank())) {
                return ResponseEntity.badRequest().body(Map.of("message", "Either an image or a prompt must be provided."));
            }

            // ── Step 1: AI Vibe Analysis ───────────────────────
            log.info(">>> Step 1/3 — Analyzing vibe via AI microservice");
            VibeAnalysisResult aiResult = vibeService.analyzeVibe(image, prompt);
            log.info("    AI result: genres={}, tempo={}, energy={}, valence={}",
                    aiResult.getGenres(), aiResult.getTargetTempo(),
                    aiResult.getEnergy(), aiResult.getValence());

            // ──────────────────────────────────────────────
            // Step 2: Fetch Track Recommendations
            // ──────────────────────────────────────────────
            log.info(">>> Step 2/3 — Fetching track recommendations");
            java.util.List<com.vibesync.backend.dto.TrackDto> tracks = spotifyService.getRecommendations(aiResult, authorizedClient);
            log.info("    Found {} tracks", tracks.size());

            if (tracks.isEmpty()) {
                log.warn("Spotify returned 0 recommendations for the given parameters");
                return ResponseEntity.noContent().build();
            }

            // ──────────────────────────────────────────────
            // Step 3: Save History & Return
            // ──────────────────────────────────────────────
            log.info(">>> Step 3/3 — Saving history");

            // We mock the URL since we are no longer creating an actual playlist,
            // but the database schema requires a non-null string.
            String dummyUrl = "Read-Only generation: " + tracks.size() + " tracks";

            // Determine effective prompt for history
            String effectivePromptForHistory = (prompt != null && !prompt.isBlank()) ? prompt : "Image Upload";

            PlaylistHistory history = PlaylistHistory.builder()
                    .userId(spotifyService.getCurrentUserId(authorizedClient)) // Fetch actual user ID
                    .spotifyPlaylistUrl(dummyUrl)
                    .vibePrompt(effectivePromptForHistory)
                    .build();

            try {
                historyRepository.save(history);
            } catch (Exception e) {
                log.warn("Failed to save playlist history (Non-fatal): {}", e.getMessage());
            }

            PlaylistResponse response = PlaylistResponse.builder()
                    .playlistName("VibeSync Recommendations") // A generic name for the recommendation list
                    .tracks(tracks)
                    .vibePrompt(effectivePromptForHistory)
                    .createdAt(Instant.now())
                    .build();

            log.info("✅ Successfully generated read-only playlist response");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("Failed to generate playlist due to server error", e);

            if (e.getMessage() != null && e.getMessage().contains("401 Unauthorized")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Spotify session expired. Please log in again."));
            }
            if (e.getMessage() != null && e.getMessage().contains("403 Forbidden")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Spotify API forbidden. Please check your developer app quota."));
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "An unexpected error occurred during generation.", "details", e.getMessage()));
        }
    }

    /**
     * GET /api/vibe/history
     *
     * Returns the authenticated user's playlist generation history.
     */
    @GetMapping("/history")
    public ResponseEntity<List<PlaylistHistory>> getHistory(
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {

        String userId = spotifyService.getCurrentUserId(authorizedClient);
        List<PlaylistHistory> history = historyRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return ResponseEntity.ok(history);
    }
}
