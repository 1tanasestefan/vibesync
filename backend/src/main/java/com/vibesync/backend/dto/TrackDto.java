package com.vibesync.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrackDto {
    private String name;
    private String artist;
    private String albumArtUrl;
    private String externalSpotifyUrl;
    private String previewUrl;
}
