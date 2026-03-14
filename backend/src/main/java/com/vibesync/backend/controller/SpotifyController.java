package com.vibesync.backend.controller;

import com.vibesync.backend.service.SpotifyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for direct Spotify library and playlist operations.
 *
 * - POST /api/spotify/save-track     → Saves a track to the user's Spotify library
 * - POST /api/spotify/create-playlist → Creates a new playlist and adds tracks
 */
@RestController
@RequestMapping("/api/spotify")
@RequiredArgsConstructor
@Slf4j
public class SpotifyController {

    private final SpotifyService spotifyService;

    /**
     * POST /api/spotify/save-track
     *
     * Saves a single track to the authenticated user's Spotify "Liked Songs" library.
     * Expects JSON body: { "trackId": "spotify_track_id" }
     */
    @PostMapping("/save-track")
    public ResponseEntity<Map<String, String>> saveTrack(
            @RequestBody Map<String, String> body,
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {

        String trackId = body.get("trackId");
        if (trackId == null || trackId.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "trackId is required."));
        }

        try {
            spotifyService.saveTrack(trackId, authorizedClient);
            log.info("✅ Track saved to library: {}", trackId);
            return ResponseEntity.ok(Map.of("message", "Track saved to your library."));
        } catch (Exception e) {
            log.error("Failed to save track {}: {}", trackId, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to save track: " + e.getMessage()));
        }
    }

    /**
     * POST /api/spotify/create-playlist
     *
     * Creates a new public playlist on the user's Spotify account and populates
     * it with the provided track URIs.
     * Expects JSON body: { "name": "playlist name", "trackUris": ["spotify:track:xxx", ...] }
     */
    @PostMapping("/create-playlist")
    public ResponseEntity<Map<String, Object>> createPlaylist(
            @RequestBody Map<String, Object> body,
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {

        String name = (String) body.get("name");
        @SuppressWarnings("unchecked")
        List<String> trackUris = (List<String>) body.get("trackUris");

        if (name == null || name.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "Playlist name is required."));
        }
        if (trackUris == null || trackUris.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "At least one track URI is required."));
        }

        try {
            Map<String, Object> result = spotifyService.createPlaylistWithTracks(
                    name, trackUris, authorizedClient);
            log.info("✅ Playlist '{}' created with {} tracks", name, trackUris.size());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Failed to create playlist '{}': {}", name, e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("message", "Failed to create playlist: " + e.getMessage()));
        }
    }
}
