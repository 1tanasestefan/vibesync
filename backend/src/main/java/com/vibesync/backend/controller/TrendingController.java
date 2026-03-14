package com.vibesync.backend.controller;

import com.vibesync.backend.model.PlaylistHistory;
import com.vibesync.backend.repository.PlaylistHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * REST controller for community trending statistics.
 * Aggregates genre and vibe prompt data from the last 30 days.
 */
@RestController
@RequestMapping("/api/trending")
@RequiredArgsConstructor
@Slf4j
public class TrendingController {

    private final PlaylistHistoryRepository historyRepository;

    /**
     * GET /api/trending
     *
     * Returns the top 5 most frequently generated genres and the
     * top 3 most common vibe prompts from the last 30 days.
     */
    @GetMapping
    public ResponseEntity<Map<String, Object>> getTrending() {
        Instant thirtyDaysAgo = Instant.now().minus(30, ChronoUnit.DAYS);
        List<PlaylistHistory> recentHistory = historyRepository.findByCreatedAtAfter(thirtyDaysAgo);

        // ── Aggregate genres ──────────────────────────────
        Map<String, Long> genreCounts = new LinkedHashMap<>();
        for (PlaylistHistory entry : recentHistory) {
            if (entry.getGenres() != null && !entry.getGenres().isBlank()) {
                for (String genre : entry.getGenres().split(",")) {
                    String trimmed = genre.trim().toLowerCase();
                    if (!trimmed.isEmpty()) {
                        genreCounts.merge(trimmed, 1L, Long::sum);
                    }
                }
            }
        }

        List<Map<String, Object>> topGenres = genreCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .map(e -> Map.<String, Object>of("name", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        // ── Aggregate vibe prompts ────────────────────────
        Map<String, Long> vibeCounts = new LinkedHashMap<>();
        for (PlaylistHistory entry : recentHistory) {
            if (entry.getVibePrompt() != null && !entry.getVibePrompt().isBlank()
                    && !entry.getVibePrompt().equalsIgnoreCase("Image Upload")) {
                String normalized = entry.getVibePrompt().trim().toLowerCase();
                // Truncate to first 60 chars for grouping
                if (normalized.length() > 60) {
                    normalized = normalized.substring(0, 60);
                }
                vibeCounts.merge(normalized, 1L, Long::sum);
            }
        }

        List<Map<String, Object>> topVibes = vibeCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(e -> Map.<String, Object>of("prompt", e.getKey(), "count", e.getValue()))
                .collect(Collectors.toList());

        log.info("Trending data — {} recent entries, {} unique genres, {} unique vibes",
                recentHistory.size(), genreCounts.size(), vibeCounts.size());

        return ResponseEntity.ok(Map.of(
                "topGenres", topGenres,
                "topVibes", topVibes,
                "totalGenerations", recentHistory.size()
        ));
    }
}
