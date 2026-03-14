"use client";

import React, { createContext, useContext, useReducer, useEffect, useCallback } from "react";

// ─── Types ───

export interface Track {
  name: string;
  artist: string;
  albumArtUrl: string;
  externalSpotifyUrl: string;
  previewUrl?: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  tracks: Track[];
  createdAt: string;
}


export interface HistoryEntry {
  id: string;
  imageUrl?: string;
  playlistName: string;
  vibePrompt: string;
  trackCount: number;
  createdAt: string;
}

export interface AppSettings {
  analysisDetail: "concise" | "detailed";
  playlistLength: 10 | 15 | 20;
}

export interface AppState {
  savedSongs: Track[];
  savedPlaylists: SavedPlaylist[];

  history: HistoryEntry[];
  settings: AppSettings;
}

// ─── Actions ───

type Action =
  | { type: "TOGGLE_SAVED_SONG"; payload: Track }
  | { type: "ADD_PLAYLIST"; payload: SavedPlaylist }
  | { type: "DELETE_PLAYLIST"; payload: string }
  | { type: "RENAME_PLAYLIST"; payload: { id: string; name: string } }
  | { type: "ADD_TRACKS_TO_PLAYLIST"; payload: { playlistId: string; tracks: Track[] } }

  | { type: "ADD_HISTORY_ENTRY"; payload: HistoryEntry }
  | { type: "UPDATE_SETTINGS"; payload: Partial<AppSettings> }
  | { type: "CLEAR_ALL_DATA" }
  | { type: "HYDRATE"; payload: AppState };

// ─── Defaults ───


const DEFAULT_STATE: AppState = {
  savedSongs: [],
  savedPlaylists: [],

  history: [],
  settings: {
    analysisDetail: "detailed",
    playlistLength: 20,
  },
};

// ─── Reducer ───

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "TOGGLE_SAVED_SONG": {
      const exists = state.savedSongs.some(
        (s) => s.name === action.payload.name && s.artist === action.payload.artist
      );
      return {
        ...state,
        savedSongs: exists
          ? state.savedSongs.filter(
              (s) => !(s.name === action.payload.name && s.artist === action.payload.artist)
            )
          : [...state.savedSongs, action.payload],
      };
    }
    case "ADD_PLAYLIST":
      return { ...state, savedPlaylists: [action.payload, ...state.savedPlaylists] };
    case "DELETE_PLAYLIST":
      return { ...state, savedPlaylists: state.savedPlaylists.filter((p) => p.id !== action.payload) };
    case "RENAME_PLAYLIST":
      return {
        ...state,
        savedPlaylists: state.savedPlaylists.map((p) =>
          p.id === action.payload.id ? { ...p, name: action.payload.name } : p
        ),
      };
    case "ADD_TRACKS_TO_PLAYLIST": {
      return {
        ...state,
        savedPlaylists: state.savedPlaylists.map((p) =>
          p.id === action.payload.playlistId
            ? { ...p, tracks: [...p.tracks, ...action.payload.tracks] }
            : p
        ),
      };
    }

    case "ADD_HISTORY_ENTRY":
      return { ...state, history: [action.payload, ...state.history] };
    case "UPDATE_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case "CLEAR_ALL_DATA":
      return { ...DEFAULT_STATE };
    case "HYDRATE":
      return action.payload;
    default:
      return state;
  }
}

// ─── Context ───

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  isSongSaved: (track: Track) => boolean;
}

const AppContext = createContext<AppContextType | null>(null);

const STORAGE_KEY = "vibesync-app-state";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, DEFAULT_STATE);
  const [hydrated, setHydrated] = React.useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AppState;
        dispatch({ type: "HYDRATE", payload: { ...DEFAULT_STATE, ...parsed } });
      }
    } catch {
      // Ignore parse errors
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on every state change (after hydration)
  useEffect(() => {
    if (hydrated) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  }, [state, hydrated]);

  const isSongSaved = useCallback(
    (track: Track) =>
      state.savedSongs.some((s) => s.name === track.name && s.artist === track.artist),
    [state.savedSongs]
  );

  return React.createElement(
    AppContext.Provider,
    { value: { state, dispatch, isSongSaved } },
    children
  );
}

export function useAppStore() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppStore must be used within AppProvider");
  return ctx;
}
