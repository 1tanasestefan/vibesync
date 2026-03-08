package com.vibesync.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Maps the JSON response from the Python AI microservice.
 * Must match the contract defined in ai-service/main.py (VibeResult schema).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VibeAnalysisResult {

    private List<String> genres;
    private int targetTempo;
    private double energy;
    private double valence;
}
