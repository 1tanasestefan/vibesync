package com.vibesync.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

/**
 * Persists every playlist generation event for user history and analytics.
 */
@Entity
@Table(name = "playlist_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /** Spotify user ID obtained from the OAuth2 principal. */
    @Column(nullable = false)
    private String userId;

    /** Full Spotify URL of the generated playlist. */
    @Column(nullable = false)
    private String spotifyPlaylistUrl;

    /** The original text prompt or auto-generated image description. */
    @Column(columnDefinition = "TEXT")
    private String vibePrompt;

    @CreationTimestamp
    @Column(updatable = false)
    private Instant createdAt;
}
