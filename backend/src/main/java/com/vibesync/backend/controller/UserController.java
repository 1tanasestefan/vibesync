package com.vibesync.backend.controller;

import com.vibesync.backend.service.SpotifyService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Handles user profile retrieval and authentication lifecycle.
 *
 * - GET  /api/user/me    → Spotify profile data (display name, image, followers)
 * - POST /api/auth/logout → Invalidates the HTTP session and logs out
 */
@RestController
@RequiredArgsConstructor
@Slf4j
public class UserController {

    private final SpotifyService spotifyService;

    /**
     * GET /api/user/me
     *
     * Returns the authenticated user's Spotify profile information including
     * display name, profile image URL, and follower count.
     */
    @GetMapping("/api/user/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(
            @RegisteredOAuth2AuthorizedClient("spotify") OAuth2AuthorizedClient authorizedClient) {
        try {
            Map<String, Object> profile = spotifyService.getUserProfile(authorizedClient);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            log.error("Failed to fetch user profile", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("message", "Failed to retrieve user profile."));
        }
    }

    /**
     * POST /api/auth/logout
     *
     * Invalidates the current HTTP session (which holds the OAuth2 tokens)
     * and returns a 200 OK. The frontend should redirect to the login page.
     */
    @PostMapping("/api/auth/logout")
    public ResponseEntity<Map<String, String>> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
            log.info("✅ User session invalidated successfully.");
        }
        return ResponseEntity.ok(Map.of("message", "Logged out successfully."));
    }
}
