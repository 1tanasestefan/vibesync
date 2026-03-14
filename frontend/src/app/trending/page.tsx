"use client";

import React, { useState, useEffect } from "react";
import { TrendingUp, Flame, BarChart3, ArrowUpRight, Loader2, Music } from "lucide-react";
import { getTrending } from "@/lib/api";

interface GenreStat {
  name: string;
  count: number;
}

interface VibeStat {
  prompt: string;
  count: number;
}

interface TrendingData {
  topGenres: GenreStat[];
  topVibes: VibeStat[];
  totalGenerations: number;
}

// Colour palette for genre cards — cycles through the array
const GENRE_COLORS = [
  "#1ED760", "#1DB954", "#6366f1", "#f59e0b", "#f43f5e",
  "#8b5cf6", "#10b981", "#ec4899",
];

// Emoji map for common genres
const GENRE_EMOJI: Record<string, string> = {
  pop: "🎤", rock: "🎸", "hip-hop": "🎧", electronic: "🎹",
  classical: "🎻", jazz: "🎷", chill: "🌊", acoustic: "🪕",
  dance: "💃", "r-n-b": "🎶", indie: "🌿", metal: "🤘",
  country: "🤠", ambient: "✨", children: "🧸", soundtrack: "🎬",
};

export default function TrendingPage() {
  const [data, setData] = useState<TrendingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrending()
      .then((res) => setData(res))
      .catch((err) => {
        console.error("Failed to load trending data:", err);
        setError(err.response?.status === 401 ? "Session expired. Please log in again." : "Could not load trending data.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8 animate-fade-in-up">
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <TrendingUp className="w-6 h-6" style={{ color: "var(--accent-green)" }} /> Trending
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Popular AI-analyzed mood and genre pairings from the last 30 days.</p>
        </header>

        {/* ── Loading ── */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-green)" }} />
          </div>
        )}

        {/* ── Error ── */}
        {error && !loading && (
          <div className="card p-10 text-center animate-fade-in">
            <Music className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
          </div>
        )}

        {/* ── Empty state ── */}
        {!loading && !error && data && data.topGenres.length === 0 && data.topVibes.length === 0 && (
          <div className="card p-10 text-center animate-fade-in">
            <TrendingUp className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No trending data yet</h3>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Generate some vibes to see trends here.</p>
          </div>
        )}

        {/* ── Live Data ── */}
        {!loading && !error && data && (data.topGenres.length > 0 || data.topVibes.length > 0) && (
          <>
            {/* Generation count */}
            <div className="card p-4 mb-6 flex items-center gap-3 animate-fade-in-up">
              <BarChart3 className="w-5 h-5" style={{ color: "var(--accent-green)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {data.totalGenerations} total generation{data.totalGenerations !== 1 ? "s" : ""} in the last 30 days
              </span>
            </div>

            {/* Top Genres */}
            {data.topGenres.length > 0 && (
              <section className="mb-10">
                <h2 className="text-base font-bold mb-4 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <Flame className="w-4 h-4" style={{ color: "#f97316" }} /> Top Genres
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                  {data.topGenres.map((genre, i) => {
                    const color = GENRE_COLORS[i % GENRE_COLORS.length];
                    const emoji = GENRE_EMOJI[genre.name] || "🎵";
                    const maxCount = data.topGenres[0].count || 1;
                    return (
                      <div key={genre.name} className="card card-hover p-4 text-center animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="text-2xl block mb-2">{emoji}</span>
                        <h3 className="font-bold text-sm capitalize" style={{ color: "var(--text-primary)" }}>{genre.name}</h3>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{genre.count} generation{genre.count !== 1 ? "s" : ""}</p>
                        {/* Bar indicator */}
                        <div className="mt-3 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--bg-elevated)" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${(genre.count / maxCount) * 100}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Top Vibes */}
            {data.topVibes.length > 0 && (
              <section>
                <h2 className="text-base font-bold mb-4 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <ArrowUpRight className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Popular Vibes
                </h2>
                <div className="space-y-2">
                  {data.topVibes.map((vibe, i) => (
                    <div key={vibe.prompt} className="card card-hover p-4 flex items-center gap-4 animate-fade-in-up" style={{ animationDelay: `${i * 50}ms` }}>
                      <span className="text-lg font-bold w-6 text-center" style={{ color: "var(--accent-green)" }}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium capitalize truncate" style={{ color: "var(--text-primary)" }}>{vibe.prompt}</p>
                      </div>
                      <span className="text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>
                        {vibe.count} time{vibe.count !== 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        <p className="text-xs text-center mt-10" style={{ color: "var(--text-muted)" }}>
          Trending data is aggregated from real user generations.
        </p>
      </div>
    </div>
  );
}
