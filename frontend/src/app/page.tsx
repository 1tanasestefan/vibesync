"use client";

import React, { useState } from "react";
import { LogIn, Music, Image as ImageIcon, Wand2, Loader2 } from "lucide-react";

export default function Home() {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleLogin = () => {
    setIsConnecting(true);
    setTimeout(() => {
      window.location.href = "http://127.0.0.1:8080/oauth2/authorization/spotify";
    }, 1000);
  };

  if (isConnecting) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: "var(--bg-base)" }}>
        <div className="relative w-20 h-20 flex items-center justify-center animate-scale-in">
          <div className="absolute inset-0">
            <div className="orbit-dot absolute w-2.5 h-2.5 rounded-full" style={{ background: "var(--accent-green)", top: "50%", left: "50%", marginTop: "-5px", marginLeft: "-5px" }} />
          </div>
          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#1ED760" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>
        <h2 className="text-xl font-bold mt-6 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>Connecting to Spotify...</h2>
        <p className="text-sm mt-2 animate-fade-in-up" style={{ color: "var(--text-secondary)", animationDelay: "100ms" }}>Initiating secure OAuth2 authorization</p>
        <Loader2 className="w-4 h-4 mt-5 animate-spin" style={{ color: "var(--accent-green)" }} />
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "var(--bg-base)" }}>
      <div className="max-w-4xl text-center flex flex-col items-center">
        {/* Logo */}
        <div className="mb-6 animate-scale-in">
          <svg viewBox="0 0 24 24" className="w-16 h-16" fill="#1ED760" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3 animate-fade-in-up" style={{ color: "var(--text-primary)" }}>
          VibeSync
        </h1>
        <p className="max-w-xl text-base md:text-lg mb-10 leading-relaxed animate-fade-in-up" style={{ color: "var(--text-secondary)", animationDelay: "50ms" }}>
          Translating your visual aesthetic into curated Spotify playlists using AI.
        </p>

        <button onClick={handleLogin} className="btn-primary text-base py-3.5 px-8 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <LogIn className="w-5 h-5" />
          Connect with Spotify
        </button>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-4 mt-20 text-left w-full" style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "2.5rem" }}>
          {[
            { icon: ImageIcon, title: "Upload Aesthetics", desc: "Drop images that capture your current vibe." },
            { icon: Wand2, title: "AI Analysis", desc: "LLaVA vision model interprets mood and context." },
            { icon: Music, title: "Curated Playlists", desc: "Custom Spotify playlists matching the energy." },
          ].map(({ icon: Icon, title, desc }, i) => (
            <div key={title} className="card card-hover p-5 animate-fade-in-up" style={{ animationDelay: `${150 + i * 50}ms` }}>
              <Icon className="w-8 h-8 mb-3" style={{ color: "var(--accent-green)" }} />
              <h3 className="text-base font-bold mb-1" style={{ color: "var(--text-primary)" }}>{title}</h3>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
