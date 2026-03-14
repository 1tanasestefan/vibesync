"use client";

import React from "react";
import { Music, Heart, ExternalLink, CheckSquare, Square } from "lucide-react";
import { Track, useAppStore } from "@/store/useAppStore";
import { saveTrack as saveTrackApi } from "@/lib/api";

interface TrackRowProps {
  track: Track;
  index: number;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}

export default function TrackRow({ track, index, selectable, selected, onToggleSelect }: TrackRowProps) {
  const { dispatch, isSongSaved } = useAppStore();
  const saved = isSongSaved(track);

  const handleSave = async () => {
    dispatch({ type: "TOGGLE_SAVED_SONG", payload: track });

    // Extract Spotify track ID from the external URL
    const match = track.externalSpotifyUrl?.match(/track\/([a-zA-Z0-9]+)/);
    if (match) {
      try {
        await saveTrackApi(match[1]);
      } catch (err) {
        console.error("Failed to save track to Spotify:", err);
      }
    }
  };

  return (
    <div className="track-row group animate-fade-in-up" style={{ animationDelay: `${index * 30}ms` }}>
      {selectable && (
        <button onClick={onToggleSelect} className="shrink-0 transition-colors" style={{ color: selected ? "var(--accent-green)" : "var(--text-muted)" }}>
          {selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
        </button>
      )}

      <span className="text-sm font-medium w-5 shrink-0 text-right" style={{ color: "var(--text-muted)" }}>{index + 1}</span>

      <div className="w-10 h-10 shrink-0 overflow-hidden rounded shadow-sm">
        {track.albumArtUrl ? (
          <img src={track.albumArtUrl} alt={track.name} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
            <Music className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          </div>
        )}
      </div>

      <div className="flex flex-col min-w-0 flex-1">
        <span className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{track.name}</span>
        <span className="text-xs truncate" style={{ color: "var(--text-secondary)" }}>{track.artist}</span>
      </div>

      <button onClick={handleSave} className={`heart-icon shrink-0 ${saved ? "active" : ""}`} title={saved ? "Remove from Saved" : "Save to Liked Songs"}>
        <Heart className="w-4 h-4" fill={saved ? "currentColor" : "none"} />
      </button>

      <a href={track.externalSpotifyUrl} target="_blank" rel="noreferrer" className="shrink-0 transition-colors" style={{ color: "var(--text-muted)" }} title="Open in Spotify">
        <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}
