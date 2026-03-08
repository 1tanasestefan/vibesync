package com.vibesync.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Response payload returned to the Next.js frontend after playlist generation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlaylistResponse {

    private String playlistName;
    private String vibePrompt;
    private Instant createdAt;
    private java.util.List<TrackDto> tracks;
}
