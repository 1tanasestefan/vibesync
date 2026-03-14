"use client";

import React, { useState, useEffect } from "react";
import { Library as LibraryIcon, Music, Clock, Heart, Trash2, Edit3, Plus } from "lucide-react";
import { useAppStore, SavedPlaylist } from "@/store/useAppStore";
import { getHistory } from "@/lib/api";
import PlaylistModal from "@/components/PlaylistModal";
import ConfirmDialog from "@/components/ConfirmDialog";

type TabKey = "playlists" | "songs" | "history";

const TABS: { key: TabKey; label: string; icon: React.ElementType }[] = [
  { key: "playlists", label: "Saved Playlists", icon: LibraryIcon },
  { key: "songs", label: "Saved Songs", icon: Heart },

  { key: "history", label: "History", icon: Clock },
];

interface BackendHistory {
  id: string;
  userId: string;
  spotifyPlaylistUrl: string;
  vibePrompt: string;
  createdAt: string;
}

export default function LibraryPage() {
  const { state, dispatch } = useAppStore();
  const [activeTab, setActiveTab] = useState<TabKey>("playlists");
  const [viewPlaylist, setViewPlaylist] = useState<SavedPlaylist | null>(null);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string | null>(null);
  const [editingPlaylistId, setEditingPlaylistId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");


  // Backend history
  const [backendHistory, setBackendHistory] = useState<BackendHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Pagination
  const [songPage, setSongPage] = useState(0);
  const songsPerPage = 15;
  const totalSongPages = Math.ceil(state.savedSongs.length / songsPerPage);
  const paginatedSongs = state.savedSongs.slice(songPage * songsPerPage, (songPage + 1) * songsPerPage);

  // Fetch backend history when tab is activated
  useEffect(() => {
    if (activeTab === "history" && backendHistory.length === 0 && !historyLoading) {
      setHistoryLoading(true);
      getHistory()
        .then((data) => setBackendHistory(data || []))
        .catch((err) => console.error("Failed to load history:", err))
        .finally(() => setHistoryLoading(false));
    }
  }, [activeTab, backendHistory.length, historyLoading]);

  const handleDeletePlaylist = () => { if (deletePlaylistId) { dispatch({ type: "DELETE_PLAYLIST", payload: deletePlaylistId }); setDeletePlaylistId(null); } };
  const handleRenamePlaylist = (id: string) => { if (editName.trim()) dispatch({ type: "RENAME_PLAYLIST", payload: { id, name: editName.trim() } }); setEditingPlaylistId(null); setEditName(""); };


  // Merge backend + local history for the History tab (deduplicated)
  const localEntries = state.history.map((h) => ({ id: h.id, prompt: h.vibePrompt, trackCount: h.trackCount, createdAt: h.createdAt, imageUrl: h.imageUrl, source: "local" as const }));

  // Filter out backend entries that already exist locally (same prompt + close timestamp)
  const deduplicatedBackend = backendHistory
    .filter((bh) => {
      return !state.history.some((lh) => {
        const timeDiff = Math.abs(new Date(bh.createdAt).getTime() - new Date(lh.createdAt).getTime());
        return lh.vibePrompt === bh.vibePrompt && timeDiff < 60_000; // within 1 minute = same entry
      });
    })
    .map((h) => ({ id: h.id, prompt: h.vibePrompt, trackCount: 0, createdAt: h.createdAt, imageUrl: undefined, source: "backend" as const }));

  const combinedHistory = [...localEntries, ...deduplicatedBackend]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Library</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>Manage your playlists, saved songs, and AI profiles.</p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setActiveTab(key)} className={`tab-btn flex items-center gap-1.5 ${activeTab === key ? "active" : ""}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Playlists */}
        {activeTab === "playlists" && (
          <div className="animate-fade-in">
            {state.savedPlaylists.length === 0 ? (
              <div className="card p-10 text-center">
                <LibraryIcon className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No playlists yet</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Create one from the Dashboard.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {state.savedPlaylists.map((pl) => (
                  <div key={pl.id} className="card card-hover p-4 cursor-pointer group relative" onClick={() => setViewPlaylist(pl)}>
                    <div className="grid grid-cols-2 gap-0.5 rounded overflow-hidden mb-3 aspect-square max-h-32">
                      {pl.tracks.slice(0, 4).map((t, i) => (
                        <div key={i} style={{ background: "var(--bg-elevated)" }}>
                          {t.albumArtUrl ? <img src={t.albumArtUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Music className="w-3 h-3" style={{ color: "var(--text-muted)" }} /></div>}
                        </div>
                      ))}
                    </div>
                    {editingPlaylistId === pl.id ? (
                      <input value={editName} onChange={(e) => setEditName(e.target.value)} onBlur={() => handleRenamePlaylist(pl.id)} onKeyDown={(e) => e.key === "Enter" && handleRenamePlaylist(pl.id)} className="input-field w-full text-sm" autoFocus onClick={(e) => e.stopPropagation()} />
                    ) : (
                      <h3 className="font-bold text-sm truncate" style={{ color: "var(--text-primary)" }}>{pl.name}</h3>
                    )}
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{pl.tracks.length} tracks</p>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); setEditingPlaylistId(pl.id); setEditName(pl.name); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}><Edit3 className="w-3 h-3" /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeletePlaylistId(pl.id); }} className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)", color: "#fca5a5" }}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Songs */}
        {activeTab === "songs" && (
          <div className="animate-fade-in">
            {state.savedSongs.length === 0 ? (
              <div className="card p-10 text-center">
                <Heart className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No saved songs</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Click the heart icon on tracks.</p>
              </div>
            ) : (
              <div className="card p-4">
                <div className="space-y-0.5">
                  {paginatedSongs.map((track, i) => (
                    <div key={`${track.name}-${i}`} className="track-row group">
                      <span className="text-sm font-medium w-5 shrink-0 text-right" style={{ color: "var(--text-muted)" }}>{songPage * songsPerPage + i + 1}</span>
                      <div className="w-9 h-9 rounded overflow-hidden shrink-0">{track.albumArtUrl ? <img src={track.albumArtUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ background: "var(--bg-elevated)" }}><Music className="w-3 h-3" style={{ color: "var(--text-muted)" }} /></div>}</div>
                      <div className="flex flex-col min-w-0 flex-1"><span className="font-medium text-sm truncate" style={{ color: "var(--text-primary)" }}>{track.name}</span><span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{track.artist}</span></div>
                      <button onClick={() => dispatch({ type: "TOGGLE_SAVED_SONG", payload: track })} className="heart-icon active shrink-0"><Heart className="w-4 h-4" fill="currentColor" /></button>
                    </div>
                  ))}
                </div>
                {totalSongPages > 1 && (
                  <div className="flex justify-center gap-1 mt-4 pt-3" style={{ borderTop: "1px solid var(--border-subtle)" }}>
                    {Array.from({ length: totalSongPages }).map((_, i) => (
                      <button key={i} onClick={() => setSongPage(i)} className="w-7 h-7 rounded text-xs font-semibold" style={{ background: songPage === i ? "var(--accent-green)" : "transparent", color: songPage === i ? "#000" : "var(--text-muted)" }}>{i + 1}</button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}


        {/* History */}
        {activeTab === "history" && (
          <div className="animate-fade-in">
            {historyLoading ? (
              <div className="card p-3">
                <div className="space-y-0.5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="track-row">
                      <div className="skeleton w-10 h-10 rounded shrink-0" />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="skeleton h-3.5 rounded" style={{ width: `${55 + i * 7}%` }} />
                        <div className="skeleton h-2.5 rounded" style={{ width: `${30 + i * 5}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : combinedHistory.length === 0 ? (
              <div className="card p-10 text-center">
                <Clock className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <h3 className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No history</h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Generate vibes to see history here.</p>
              </div>
            ) : (
              <div className="card p-3">
                <div className="space-y-0.5 max-h-[550px] overflow-y-auto custom-scrollbar">
                  {combinedHistory.map((entry) => (
                    <div key={entry.id} className="track-row">
                      {entry.imageUrl ? (
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0"><img src={entry.imageUrl} alt="" className="w-full h-full object-cover" /></div>
                      ) : (
                        <div className="w-10 h-10 rounded flex items-center justify-center shrink-0" style={{ background: "var(--bg-elevated)" }}><Music className="w-4 h-4" style={{ color: "var(--text-muted)" }} /></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{entry.prompt || "Image Upload"}</p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>{new Date(entry.createdAt).toLocaleDateString()}</p>
                      </div>
                      {entry.trackCount > 0 && <span className="text-xs font-medium" style={{ color: "var(--accent-green)" }}>{entry.trackCount} tracks</span>}
                      {entry.source === "backend" && <span className="text-xs rounded px-1.5 py-0.5" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)" }}>DB</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {viewPlaylist && <PlaylistModal title={viewPlaylist.name} tracks={viewPlaylist.tracks} onClose={() => setViewPlaylist(null)} />}
      {deletePlaylistId && <ConfirmDialog title="Delete Playlist" message="This cannot be undone." confirmLabel="Delete" onConfirm={handleDeletePlaylist} onCancel={() => setDeletePlaylistId(null)} />}
    </div>
  );
}
