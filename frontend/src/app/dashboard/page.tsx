"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Sparkles, Loader2, PlayCircle, X, Image as ImageIcon, ListPlus, Plus, User, Crown } from "lucide-react";
import { generateVibePlaylist, createPlaylist as createPlaylistApi, getUserProfile } from "@/lib/api";
import { useAppStore, Track, SavedPlaylist } from "@/store/useAppStore";
import TrackRow from "@/components/TrackRow";
import SkeletonCard from "@/components/SkeletonCard";

const loadingSteps = [
  "Compressing image...",
  "Analyzing visual vibe...",
  "Extracting mood & tone...",
  "Curating genres...",
  "Searching Spotify...",
  "Building tracklist...",
  "Releasing memory...",
];

export default function Dashboard() {
  const { state, dispatch } = useAppStore();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [playlistResult, setPlaylistResult] = useState<{
    playlistName?: string;
    vibePrompt?: string;
    visualAnalysis?: string;
    tracks: Track[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [selectedTracks, setSelectedTracks] = useState<Set<number>>(new Set());
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isGenerating) {
      setLoadingIdx(0);
      interval = setInterval(() => setLoadingIdx((p) => (p + 1) % loadingSteps.length), 2800);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  // Fetch user profile for the avatar
  useEffect(() => {
    getUserProfile().then(setProfile).catch(() => {});
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setImageFile(acceptedFiles[0]);
      setImagePreview(URL.createObjectURL(acceptedFiles[0]));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] }, maxFiles: 1,
  });

  const clearImage = (e: React.MouseEvent) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); };

  const handleGenerate = async () => {
    if (!imageFile && !prompt.trim()) { setError("Provide an image or text description."); return; }
    setIsGenerating(true); setError(null); setPlaylistResult(null); setSelectedTracks(new Set());
    try {
      const result = await generateVibePlaylist(imageFile, prompt, state.settings.playlistLength);
      if (result?.tracks?.length) {
        setPlaylistResult(result);
        dispatch({ type: "ADD_HISTORY_ENTRY", payload: { id: Date.now().toString(), imageUrl: imagePreview || undefined, playlistName: result.playlistName || "VibeSync Playlist", vibePrompt: result.vibePrompt || prompt || "Image Upload", trackCount: result.tracks.length, createdAt: new Date().toISOString() } });
      } else { setError("Received an invalid response."); }
    } catch (err: any) {
      if (err.response?.status === 401 || err.response?.status === 403) setError("Session expired. Please log in again.");
      else setError(err.response?.data?.message || err.message || "Failed to generate playlist.");
    } finally { setIsGenerating(false); }
  };

  const toggleTrackSelect = (i: number) => setSelectedTracks((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });

  const handleCreatePlaylist = async () => {
    if (!playlistResult) return;
    const name = newPlaylistName.trim() || `Vibe Playlist ${state.savedPlaylists.length + 1}`;

    // Extract track URIs from Spotify URLs
    const trackUris = playlistResult.tracks
      .map((t) => { const m = t.externalSpotifyUrl?.match(/track\/([a-zA-Z0-9]+)/); return m ? `spotify:track:${m[1]}` : null; })
      .filter(Boolean) as string[];

    // Save to Spotify via API
    try {
      const result = await createPlaylistApi(name, trackUris);
      showToast(`✓ Playlist "${name}" created on Spotify!`);

      // Also save locally
      const playlist: SavedPlaylist = { id: Date.now().toString(), name, tracks: playlistResult.tracks, createdAt: new Date().toISOString() };
      dispatch({ type: "ADD_PLAYLIST", payload: playlist });
    } catch (err: any) {
      console.error("Failed to create playlist on Spotify:", err);
      showToast("Saved locally (Spotify API error)");
      const playlist: SavedPlaylist = { id: Date.now().toString(), name, tracks: playlistResult.tracks, createdAt: new Date().toISOString() };
      dispatch({ type: "ADD_PLAYLIST", payload: playlist });
    }

    setShowCreatePlaylist(false);
    setNewPlaylistName("");
  };

  const handleAddSelectedToPlaylist = (playlistId: string) => {
    if (!playlistResult) return;
    const tracks = Array.from(selectedTracks).map((i) => playlistResult.tracks[i]);
    dispatch({ type: "ADD_TRACKS_TO_PLAYLIST", payload: { playlistId, tracks } });
    setSelectedTracks(new Set());
    setShowAddToPlaylist(false);
    showToast(`✓ ${tracks.length} tracks added`);
  };

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8 animate-fade-in-up flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h1 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>Welcome to VibeSync</h1>
              <span className="badge"><Sparkles className="w-3 h-3" /> AI-Powered Music Discovery</span>
            </div>
            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Upload a photo or describe a vibe to curate your perfect tracklist.</p>
          </div>

          {/* User Avatar */}
          {profile && (
            <div className="flex flex-col items-center gap-1.5 shrink-0 mt-1">
              <div className="relative">
                {profile.imageUrl ? (
                  <img src={profile.imageUrl} alt={profile.displayName} className="w-10 h-10 rounded-full object-cover shadow-lg" style={{ border: "2px solid var(--bg-elevated)" }} />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg" style={{ background: "var(--bg-elevated)", border: "2px solid var(--border-subtle)" }}>
                    <User className="w-5 h-5" style={{ color: "var(--text-muted)" }} />
                  </div>
                )}
                {profile.product === "premium" && (
                  <div className="absolute -bottom-1.5 -right-1.5 bg-black/80 rounded-full p-1 shadow-sm backdrop-blur-sm" style={{ color: "#fbbf24", border: "1px solid rgba(251,191,36,0.3)" }}>
                    <Crown className="w-3 h-3" fill="currentColor" />
                  </div>
                )}
              </div>
            </div>
          )}
        </header>

        {/* Content */}
        {isGenerating ? (
          <div className="animate-fade-in">
            <SkeletonCard lines={6} />
            <div className="flex items-center justify-center gap-2 mt-5">
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--accent-green)" }} />
              <span key={loadingIdx} className="text-sm font-medium animate-fade-in" style={{ color: "var(--text-secondary)" }}>{loadingSteps[loadingIdx]}</span>
            </div>
          </div>
        ) : (
          <div className="card p-6 md:p-8 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Upload */}
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <UploadCloud className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Upload a Vibe Image
                </h2>
                <div {...getRootProps()} className={`upload-zone ${isDragActive ? "drag-active" : ""} relative flex flex-col items-center justify-center w-full h-56 cursor-pointer overflow-hidden group`}>
                  <input {...getInputProps()} />
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-40 transition-opacity" />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-sm font-medium text-white">Drop new image</p>
                      </div>
                      <button onClick={clearImage} className="absolute top-2 right-2 p-1.5 rounded bg-black/60 text-white hover:bg-red-500/80 transition-colors" title="Clear">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center px-4">
                      <UploadCloud className="w-7 h-7 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                      <p className="text-sm" style={{ color: "var(--text-secondary)" }}><span className="font-semibold" style={{ color: "var(--accent-green)" }}>Click to upload</span> or drag and drop</p>
                      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>PNG, JPG, WebP up to 10MB</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt */}
              <div>
                <h2 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                  <ImageIcon className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Describe the Mood
                </h2>
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="E.g., late night coding with neon city lights, rain outside..." className="input-field w-full h-56 resize-none text-sm leading-relaxed" />
              </div>
            </div>

            {error && <div className="mt-5 p-3 rounded text-sm text-center" style={{ background: "rgba(239,68,68,0.1)", color: "#fca5a5" }}>{error}</div>}

            <div className="mt-6 flex justify-center">
              <button onClick={handleGenerate} disabled={isGenerating || (!imageFile && !prompt.trim())} className="btn-primary text-base py-3 px-8">
                <PlayCircle className="w-5 h-5" /> Curate Tracklist
              </button>
            </div>
          </div>
        )}

        {/* Results */}
        {playlistResult && (
          <div className="mt-10 animate-fade-in-up">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
              <h3 className="text-base font-bold flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
                <Sparkles className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Your Custom Vibe
              </h3>
              <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
            </div>

            {/* Visual analysis */}
            {(playlistResult.visualAnalysis || imagePreview) && (
              <div className="card p-4 mb-4 flex items-start gap-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
                {imagePreview && <div className="w-16 h-16 rounded overflow-hidden shrink-0 shadow"><img src={imagePreview} alt="Analyzed" className="w-full h-full object-cover" /></div>}
                <div>
                  <h4 className="text-xs font-semibold mb-1" style={{ color: "var(--accent-green)" }}>Visual Analysis</h4>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{playlistResult.visualAnalysis || playlistResult.vibePrompt || "AI analyzed the image."}</p>
                </div>
              </div>
            )}

            {/* Tracklist */}
            <div className="card p-5 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
              <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{playlistResult.tracks.length} tracks</span>
                <div className="flex items-center gap-2">
                  {selectedTracks.size > 0 && (
                    <div className="relative">
                      <button onClick={() => setShowAddToPlaylist(!showAddToPlaylist)} className="badge cursor-pointer"><Plus className="w-3 h-3" /> Add {selectedTracks.size} to Playlist</button>
                      {showAddToPlaylist && state.savedPlaylists.length > 0 && (
                        <div className="absolute right-0 top-full mt-1.5 w-52 card p-1.5 z-50 animate-scale-in">
                          {state.savedPlaylists.map((pl) => (
                            <button key={pl.id} onClick={() => handleAddSelectedToPlaylist(pl.id)} className="w-full text-left px-3 py-1.5 text-sm rounded transition-colors hover:bg-[var(--bg-elevated)]" style={{ color: "var(--text-secondary)" }}>{pl.name}</button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <button onClick={() => setShowCreatePlaylist(true)} className="btn-primary !py-1.5 !px-4 !text-sm">
                    <ListPlus className="w-4 h-4" /> Create Playlist
                  </button>
                </div>
              </div>
              <div className="space-y-0.5 max-h-[550px] overflow-y-auto custom-scrollbar">
                {playlistResult.tracks.map((track, i) => (
                  <TrackRow key={`${track.name}-${i}`} track={track} index={i} selectable selected={selectedTracks.has(i)} onToggleSelect={() => toggleTrackSelect(i)} />
                ))}
              </div>
            </div>
          </div>
        )}

        <footer className="mt-12 pb-6 text-center">
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>Designed & developed by <span style={{ color: "var(--accent-green)" }} className="font-semibold">Tanase Stefan-Daniel</span></p>
        </footer>
      </div>

      {/* Create Playlist Modal */}
      {showCreatePlaylist && (
        <div className="modal-backdrop" onClick={() => setShowCreatePlaylist(false)}>
          <div className="modal-content card w-full max-w-md mx-4 p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold mb-3" style={{ color: "var(--text-primary)" }}>Create New Playlist</h3>
            <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder={`Vibe Playlist ${state.savedPlaylists.length + 1}`} className="input-field w-full mb-4" autoFocus onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowCreatePlaylist(false)} className="btn-secondary !text-sm !py-2">Cancel</button>
              <button onClick={handleCreatePlaylist} className="btn-primary !text-sm !py-2">Save to Spotify</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
