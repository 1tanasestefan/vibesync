package com.vibesync.backend.service;

import com.vibesync.backend.dto.VibeAnalysisResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Orchestrates all interactions with the Spotify Web API:
 *   1. Fetch track recommendations based on AI-generated parameters.
 *   2. Create a new playlist on the user's account.
 *   3. Populate the playlist with the recommended tracks.
 */
@Service
@Slf4j
public class SpotifyService {

    private final WebClient webClient;

    public SpotifyService(
            WebClient.Builder webClientBuilder,
            @Value("${vibesync.spotify.api-base-url}") String spotifyBaseUrl) {
        this.webClient = webClientBuilder.baseUrl(spotifyBaseUrl).build();
    }

    // ──────────────────────────────────────────────
    // 1. Get Recommendations
    // ──────────────────────────────────────────────

    /**
     * Calls Spotify's /v1/search endpoint as a polyfill since the /v1/recommendations
     * endpoint has been deprecated for new apps as of November 2024 (returns 404).
     *
     * @return list of hydrated TrackDto objects containing track details and external URLs.
     */
    public List<com.vibesync.backend.dto.TrackDto> getRecommendations(VibeAnalysisResult vibe, OAuth2AuthorizedClient authorizedClient) {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();

        List<String> genres = vibe.getGenres();
        if (genres == null || genres.isEmpty()) {
            genres = List.of("pop"); // Fallback if list is entirely empty/null
        }

        List<String> validGenres = genres.stream()
                .filter(g -> g != null && !g.isBlank())
                .limit(4) // 4 genres max to split 20 tracks nicely
                .collect(Collectors.toList());

        if (validGenres.isEmpty()) {
            validGenres.add("pop"); // Strict validation
        }

        log.info("Fetching Spotify tracks via Search API (Recommendations Deprecated) — genres={}", validGenres);

        List<com.vibesync.backend.dto.TrackDto> accumulatedTracks = new java.util.ArrayList<>();
        int tracksPerGenre = 20 / validGenres.size();

        for (String genre : validGenres) {
            try {
                // Build a search query like: genre:"ambient"
                // Adding a random year range helps shuffle results so it's not always the exact same top 5 tracks
                int randomOffset = (int) (Math.random() * 50); 
                String query = "genre:\"" + genre + "\"";

                @SuppressWarnings("unchecked")
                Map<String, Object> response = webClient.get()
                        .uri(uriBuilder -> {
                            java.net.URI uri = uriBuilder
                                    .path("/search")
                                    .queryParam("q", query)
                                    .queryParam("type", "track")
                                    .queryParam("limit", tracksPerGenre)
                                    .queryParam("offset", randomOffset)
                                    .build();
                            log.info("Requesting Spotify URL: {}", uri);
                            return uri;
                        })
                        .header("Authorization", "Bearer " + accessToken)
                        .retrieve()
                        .bodyToMono(Map.class)
                        .block();

                if (response != null && response.containsKey("tracks")) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> tracksObj = (Map<String, Object>) response.get("tracks");
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> items = (List<Map<String, Object>>) tracksObj.get("items");

                    if (items != null) {
                        for (Map<String, Object> item : items) {
                            
                            // Safe parsing of Spotify JSON structure
                            String trackName = (String) item.get("name");
                            
                            String artistName = "Unknown Artist";
                            @SuppressWarnings("unchecked")
                            List<Map<String, Object>> artists = (List<Map<String, Object>>) item.get("artists");
                            if (artists != null && !artists.isEmpty()) {
                                artistName = (String) artists.get(0).get("name");
                            }
                            
                            String albumArtUrl = "";
                            @SuppressWarnings("unchecked")
                            Map<String, Object> album = (Map<String, Object>) item.get("album");
                            if (album != null) {
                                @SuppressWarnings("unchecked")
                                List<Map<String, Object>> images = (List<Map<String, Object>>) album.get("images");
                                if (images != null && !images.isEmpty()) {
                                    albumArtUrl = (String) images.get(0).get("url");
                                }
                            }
                            
                            String externalUrl = "";
                            @SuppressWarnings("unchecked")
                            Map<String, String> externalUrls = (Map<String, String>) item.get("external_urls");
                            if (externalUrls != null) {
                                externalUrl = externalUrls.get("spotify");
                            }
                            
                            if (trackName != null && externalUrl != null) {
                                accumulatedTracks.add(com.vibesync.backend.dto.TrackDto.builder()
                                        .name(trackName)
                                        .artist(artistName)
                                        .albumArtUrl(albumArtUrl)
                                        .externalSpotifyUrl(externalUrl)
                                        .build());
                            }
                        }
                    }
                }

            } catch (WebClientResponseException ex) {
                log.error("Spotify Search API error for genre '{}' — HTTP {}: {}",
                        genre, ex.getStatusCode(), ex.getResponseBodyAsString());
                // Continue to next genre rather than failing the whole playlist
            }
        }

        if (accumulatedTracks.isEmpty()) {
            throw new RuntimeException("Failed to fetch any tracks from Spotify Search API.");
        }

        log.info("Received {} track recommendations from Spotify via Search API", accumulatedTracks.size());
        return accumulatedTracks;
    }

    // ──────────────────────────────────────────────
    // Helper: Get current user's Spotify ID
    // ──────────────────────────────────────────────

    /**
     * Fetches the authenticated user's Spotify profile ID.
     */
    public String getCurrentUserId(OAuth2AuthorizedClient authorizedClient) {
        String accessToken = authorizedClient.getAccessToken().getTokenValue();

        @SuppressWarnings("unchecked")
        Map<String, Object> profile = webClient.get()
                .uri("/me")
                .header("Authorization", "Bearer " + accessToken)
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (profile == null || !profile.containsKey("id")) {
            throw new RuntimeException("Could not retrieve Spotify user profile.");
        }

        return (String) profile.get("id");
    }
}
