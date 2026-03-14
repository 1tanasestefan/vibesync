"use client";

import React from "react";
import { X } from "lucide-react";
import { Track } from "@/store/useAppStore";
import TrackRow from "./TrackRow";

interface PlaylistModalProps {
  title: string;
  tracks: Track[];
  onClose: () => void;
}

export default function PlaylistModal({ title, tracks, onClose }: PlaylistModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content card w-full max-w-2xl max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 pb-3">
          <div>
            <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{tracks.length} tracks</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded flex items-center justify-center transition-colors" style={{ color: "var(--text-secondary)" }}>
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mx-5 h-px" style={{ background: "var(--border-subtle)" }} />
        <div className="flex-1 overflow-y-auto p-5 pt-3 custom-scrollbar space-y-0.5">
          {tracks.map((track, i) => (
            <TrackRow key={`${track.name}-${track.artist}-${i}`} track={track} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
