"use client";

import React from "react";
import { Sparkles, LogIn, Music, Image as ImageIcon, Wand2 } from "lucide-react";

export default function Home() {
  const handleLogin = () => {
    // The user will be sent to our Spring Boot backend which initializes the Spotify OAuth flow
    window.location.href = "http://127.0.0.1:8080/oauth2/authorization/spotify";
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 selection:bg-purple-500/30 font-sans flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-gradient-to-br from-purple-600/20 via-transparent to-transparent blur-[120px] rounded-full mix-blend-screen opacity-70 animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] bg-gradient-to-tl from-emerald-600/20 via-transparent to-transparent blur-[120px] rounded-full mix-blend-screen opacity-70 animate-pulse" style={{ animationDuration: '10s', animationDelay: '2s' }} />
      </div>

      <div className="container mx-auto max-w-5xl z-10 text-center flex flex-col items-center">
        
        {/* Core Branding */}
        <div className="mb-8 inline-flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xl border border-neutral-800 rounded-full shadow-2xl">
          <Sparkles className="w-8 h-8 text-purple-400 mr-3 animate-pulse" />
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-emerald-400 to-purple-400">
            VibeSync
          </h1>
        </div>

        <p className="max-w-2xl text-lg md:text-2xl text-neutral-300 font-medium mb-12 leading-relaxed">
          Translating your visual aesthetic and daily moods directly into curated Spotify playlists using Artificial Intelligence.
        </p>

        {/* Action Button */}
        <button
          onClick={handleLogin}
          className="group relative flex items-center gap-3 bg-[#1DB954] hover:bg-[#1ed760] text-black font-bold text-lg md:text-xl py-4 px-10 rounded-full transition-all duration-300 transform hover:scale-105 shadow-[0_0_40px_rgba(29,185,84,0.4)] shadow-[#1DB954]/30 overflow-hidden"
        >
          <LogIn className="w-6 h-6 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
          <span>Connect with Spotify</span>
          <div className="absolute inset-0 -z-10 translate-x-[-100%] bg-white/20 transition-transform duration-500 group-hover:translate-x-[100%]" />
        </button>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left border-t border-neutral-800/50 pt-16">
          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 transition-transform hover:-translate-y-2 duration-300">
            <ImageIcon className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-neutral-200 mb-2">Upload Aesthetics</h3>
            <p className="text-neutral-400">Drag and drop images that capture your current vibe, outfit, or surroundings.</p>
          </div>
          
          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 transition-transform hover:-translate-y-2 duration-300">
            <Wand2 className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-xl font-bold text-neutral-200 mb-2">AI Analysis</h3>
            <p className="text-neutral-400">Our LLaVA vision model interprets the colors, mood, and context of your image.</p>
          </div>

          <div className="bg-neutral-900/40 backdrop-blur-md border border-neutral-800 rounded-3xl p-6 transition-transform hover:-translate-y-2 duration-300">
            <Music className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-xl font-bold text-neutral-200 mb-2">Curated Playlists</h3>
            <p className="text-neutral-400">We automatically construct and save a custom Spotify playlist matching the exact energy.</p>
          </div>
        </div>

      </div>
    </main>
  );
}
