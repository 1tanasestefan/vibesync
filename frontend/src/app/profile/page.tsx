"use client";

import React, { useState, useEffect } from "react";
import { User, LogOut, Settings, Crown, Users, Loader2 } from "lucide-react";
import { getUserProfile, logout as logoutApi } from "@/lib/api";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useAppStore } from "@/store/useAppStore";

interface SpotifyProfile {
  id: string;
  displayName: string;
  email: string;
  imageUrl: string;
  followerCount: number;
  country: string;
  product: string;
}

export default function ProfilePage() {
  const { state, dispatch } = useAppStore();
  const [profile, setProfile] = useState<SpotifyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    getUserProfile()
      .then((data) => setProfile(data))
      .catch((err) => {
        console.error("Failed to load profile:", err);
        setError(err.response?.status === 401 ? "Session expired" : "Failed to load profile");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try { await logoutApi(); } catch (e) { /* best-effort */ }
    window.location.href = "/";
  };

  const handleDeleteAll = () => {
    dispatch({ type: "CLEAR_ALL_DATA" });
    setShowDeleteConfirm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: "var(--accent-green)" }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Profile</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Your Spotify account and preferences.</p>
        </header>

        {error ? (
          <div className="card p-8 text-center animate-fade-in">
            <User className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{error}</p>
            <button onClick={() => window.location.href = "/"} className="btn-primary mt-4 !text-sm">Re-connect</button>
          </div>
        ) : profile && (
          <>
            {/* Profile Card */}
            <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
              <div className="flex items-center gap-4">
                {profile.imageUrl ? (
                  <img src={profile.imageUrl} alt={profile.displayName} className="w-16 h-16 rounded-full object-cover shadow" />
                ) : (
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}>
                    <User className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate" style={{ color: "var(--text-primary)" }}>{profile.displayName}</h2>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <Users className="w-3 h-3" /> {profile.followerCount} followers
                    </span>
                    {profile.product === "premium" && (
                      <span className="badge !text-xs"><Crown className="w-3 h-3" /> Premium</span>
                    )}
                    {profile.country && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{profile.country}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Spotify Connection */}
            <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded flex items-center justify-center" style={{ background: "rgba(30,215,96,0.1)" }}>
                    <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#1ED760" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Spotify</p>
                    <p className="text-xs" style={{ color: "var(--accent-green)" }}>● Connected</p>
                  </div>
                </div>
                <button onClick={() => setShowLogout(true)} className="btn-secondary !text-xs !py-1.5 !px-3" style={{ borderColor: "rgba(239,68,68,0.2)", color: "#fca5a5" }}>
                  <LogOut className="w-3 h-3" /> Disconnect
                </button>
              </div>
            </div>

            {/* App Settings */}
            <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
              <h3 className="text-sm font-bold mb-4 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Settings className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> App Settings
              </h3>
              <div className="mb-5">
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>AI Analysis Detail</label>
                <div className="flex flex-col gap-2">
                  <button onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { analysisDetail: "concise" } })} className="p-3 rounded-lg text-left transition-all border border-transparent" style={{ background: state.settings.analysisDetail === "concise" ? "rgba(30,215,96,0.15)" : "var(--bg-elevated)", borderColor: state.settings.analysisDetail === "concise" ? "var(--accent-green)" : "transparent" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: state.settings.analysisDetail === "concise" ? "var(--accent-green)" : "var(--text-primary)" }}>Concise</span>
                      {state.settings.analysisDetail === "concise" && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-green)" }} />}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Faster generation. Best for simple images or clear, straightforward text prompts.</p>
                  </button>
                  <button onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { analysisDetail: "detailed" } })} className="p-3 rounded-lg text-left transition-all border border-transparent" style={{ background: state.settings.analysisDetail === "detailed" ? "rgba(30,215,96,0.15)" : "var(--bg-elevated)", borderColor: state.settings.analysisDetail === "detailed" ? "var(--accent-green)" : "transparent" }}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold" style={{ color: state.settings.analysisDetail === "detailed" ? "var(--accent-green)" : "var(--text-primary)" }}>Detailed (Recommended)</span>
                      {state.settings.analysisDetail === "detailed" && <div className="w-2 h-2 rounded-full" style={{ background: "var(--accent-green)" }} />}
                    </div>
                    <p className="text-xs" style={{ color: "var(--text-secondary)" }}>Deep visual and contextual analysis. Best for complex images (lighting, outfits, expressions) to get highly accurate musical curation.</p>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold mb-2 block" style={{ color: "var(--text-secondary)" }}>Default Playlist Length</label>
                <div className="flex gap-2">
                  {([10, 15, 20] as const).map((n) => (
                    <button key={n} onClick={() => dispatch({ type: "UPDATE_SETTINGS", payload: { playlistLength: n } })} className="flex-1 py-2.5 rounded-lg text-sm font-bold transition-all" style={{ background: state.settings.playlistLength === n ? "var(--accent-green)" : "var(--bg-elevated)", color: state.settings.playlistLength === n ? "#000" : "var(--text-secondary)" }}>
                      {n} tracks
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Danger */}
            <div className="card p-5 animate-fade-in-up" style={{ animationDelay: "200ms", borderLeft: "2px solid rgba(239,68,68,0.3)" }}>
              <h3 className="text-sm font-bold mb-1" style={{ color: "#fca5a5" }}>Danger Zone</h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-secondary)" }}>Delete all local data (playlists, songs, profiles). Spotify data is unaffected.</p>
              <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-1.5 rounded-full text-xs font-bold" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}>Delete All Data</button>
            </div>
          </>
        )}
      </div>

      {showLogout && <ConfirmDialog title="Disconnect Spotify" message="This will log you out and redirect to the login page." confirmLabel="Disconnect" onConfirm={handleLogout} onCancel={() => setShowLogout(false)} />}
      {showDeleteConfirm && <ConfirmDialog title="Delete All Data" message="All local playlists, songs, and mood profiles will be erased." confirmLabel="Delete" onConfirm={handleDeleteAll} onCancel={() => setShowDeleteConfirm(false)} />}
    </div>
  );
}
