"use client";

import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, Music, Sparkles, Loader2, PlayCircle, X } from "lucide-react";
import { generateVibePlaylist } from "@/services/api";

export default function Dashboard() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  // Instead of a URL, we now receive a full payload of tracks
  const [playlistResult, setPlaylistResult] = useState<{
    playlistName?: string;
    vibePrompt?: string;
    tracks: {
      name: string;
      artist: string;
      albumArtUrl: string;
      externalSpotifyUrl: string;
    }[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".webp"],
    },
    maxFiles: 1,
  });

  const clearImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview(null);
  };

  const handleGenerate = async () => {
    if (!imageFile && !prompt.trim()) {
      setError("Please provide either an image vibe or a text description.");
      return;
    }

    setIsGenerating(true);
    setError(null);
    setPlaylistResult(null);

    try {
      const result = await generateVibePlaylist(imageFile, prompt);
      
      // Expected payload format directly mirrors PlaylistResponse DTO
      if (result && result.tracks && Array.isArray(result.tracks)) {
        setPlaylistResult(result);
      } else {
        setError("Received an invalid response format from the server.");
        console.error("Backend response:", result);
      }
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Your session expired. Please go back and Login with Spotify again.");
      } else {
        setError(err.response?.data?.message || err.message || "Failed to generate playlist. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-purple-500/30 font-sans pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-600/10 via-transparent to-transparent blur-[120px] rounded-full mix-blend-screen opacity-50" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-emerald-600/10 via-transparent to-transparent blur-[120px] rounded-full mix-blend-screen opacity-50" />
      </div>

      <div className="container mx-auto px-6 py-12 max-w-4xl relative z-10">
        
        {/* Header section */}
        <header className="mb-12 text-center md:text-left pt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-emerald-400 flex items-center justify-center md:justify-start gap-3">
            <Sparkles className="w-8 h-8 text-purple-400" />
            Welcome to VibeSync
          </h1>
          <p className="mt-4 text-neutral-400 text-lg max-w-2xl">
            You are successfully authenticated. Upload a photo or type a specific vibe to let the AI curate your perfect tracklist.
          </p>
        </header>

        {/* Main Content Card */}
        <div className="bg-neutral-900/60 backdrop-blur-2xl border border-neutral-800 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle inner glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-50 pointer-events-none" />

          <div className="grid md:grid-cols-2 gap-10 relative z-10">
            {/* Left Col: Upload */}
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-200">
                <UploadCloud className="w-5 h-5 text-purple-400" />
                Upload a Vibe Image
              </h2>
              
              <div
                {...getRootProps()}
                className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                  isDragActive
                    ? "border-purple-500 bg-purple-500/10 scale-[1.02]"
                    : "border-neutral-700 bg-neutral-900/50 hover:bg-neutral-800 hover:border-neutral-500"
                }`}
              >
                <input {...getInputProps()} />
                
                {imagePreview ? (
                  <>
                    <img 
                      src={imagePreview} 
                      alt="Vibe Preview" 
                      className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity group-hover:opacity-40"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                      <p className="font-medium text-white mb-2">Drop new image to replace</p>
                    </div>
                    <button 
                      onClick={clearImage}
                      className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-red-500/90 rounded-full text-white backdrop-blur-md transition-colors shadow-lg"
                      title="Clear image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                    <div className="p-4 bg-neutral-800 rounded-full mb-4 group-hover:scale-110 group-hover:bg-neutral-700 transition-all duration-300">
                      <UploadCloud className="w-8 h-8 text-neutral-400" />
                    </div>
                    <p className="mb-2 text-sm text-neutral-300">
                      <span className="font-semibold text-purple-400">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-neutral-500 font-medium">PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Col: Prompt */}
            <div className="flex flex-col gap-4">
               <h2 className="text-xl font-semibold flex items-center gap-2 text-neutral-200">
                <Music className="w-5 h-5 text-emerald-400" />
                Describe the Mood
              </h2>
              
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., late night coding session with neon city lights reflecting in the window, rain pouring down outside..."
                className="w-full h-32 md:h-full bg-neutral-900/50 border border-neutral-700 text-neutral-200 rounded-2xl p-5 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none resize-none transition-all placeholder:text-neutral-600 text-base leading-relaxed"
              />
            </div>
          </div>

          {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200 text-sm text-center animate-in fade-in slide-in-from-bottom-2">
              {error}
            </div>
          )}

          {/* Action Button */}
          <div className="mt-10 flex justify-center relative z-10">
            <button
              onClick={handleGenerate}
              disabled={isGenerating || (!imageFile && !prompt.trim())}
              className={`group relative flex items-center justify-center gap-3 w-full md:w-auto md:min-w-[320px] overflow-hidden rounded-full p-4 font-bold text-lg transition-all duration-300
                ${isGenerating || (!imageFile && !prompt.trim())
                  ? "bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-70"
                  : "bg-white text-black hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.15)]"
                }
              `}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>Consulting the vibe authorities...</span>
                </>
              ) : (
                <>
                  <PlayCircle className="w-6 h-6 group-hover:text-emerald-500 transition-colors" />
                  <span>Curate Tracklist</span>
                  {/* Hover effect gradient overlay */}
                  <div className="absolute inset-0 -z-10 translate-x-[-100%] bg-gradient-to-r from-purple-200 via-emerald-200 to-purple-200 opacity-20 transition-transform duration-500 group-hover:translate-x-[100%]" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Read-Only Tracklist Result Section */}
        {playlistResult && (
          <div className="mt-16 animate-in slide-in-from-bottom-8 fade-in duration-700">
            <div className="flex items-center justify-center mb-8 gap-4">
              <div className="h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent flex-1" />
              <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-emerald-400 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-emerald-400" />
                Your Custom Vibe
                <Sparkles className="w-6 h-6 text-purple-400" />
              </h3>
              <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent flex-1" />
            </div>
            
            <div className="rounded-[2rem] overflow-hidden shadow-2xl border border-neutral-800 bg-neutral-900/50 p-6 backdrop-blur-xl">
              
              <div className="mb-6 flex justify-between items-center text-sm text-neutral-400">
                <span>{playlistResult.tracks.length} curated tracks</span>
                <span className="italic">"{playlistResult.vibePrompt || "Image Upload"}"</span>
              </div>

              {/* Scrollable Tracklist */}
              <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {playlistResult.tracks.map((track, i) => (
                  <div 
                    key={i}
                    className="group flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-black/40 hover:bg-neutral-800/60 border border-transparent hover:border-neutral-700/50 transition-all gap-4"
                  >
                    <div className="flex items-center gap-4 w-full">
                      {/* Album Art */}
                      <div className="relative w-16 h-16 shrink-0 overflow-hidden rounded-xl shadow-lg group-hover:shadow-purple-500/20 transition-all">
                        {track.albumArtUrl ? (
                          <img src={track.albumArtUrl} alt={track.name} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full bg-neutral-800 flex items-center justify-center">
                            <Music className="w-6 h-6 text-neutral-600" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <PlayCircle className="w-8 h-8 text-white drop-shadow-md" />
                        </div>
                      </div>

                      {/* Track Details */}
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-bold text-neutral-100 truncate text-lg group-hover:text-purple-300 transition-colors">
                          {track.name}
                        </span>
                        <span className="text-zinc-400 text-sm truncate">
                          {track.artist}
                        </span>
                      </div>
                    </div>

                    {/* Listen Actions */}
                    <div className="w-full md:w-auto flex justify-end shrink-0">
                       <a 
                        href={track.externalSpotifyUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="w-full md:w-auto text-center text-sm font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 px-5 py-2.5 rounded-full transition-all"
                      >
                        Listen
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
