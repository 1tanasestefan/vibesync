"use client";

import React from "react";
import { Settings as SettingsIcon, Palette, Info, Github, ExternalLink, Sparkles } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="min-h-screen p-6 md:p-8">
      <div className="max-w-2xl mx-auto">
        <header className="mb-6 animate-fade-in-up">
          <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Settings</h1>
          <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>System-level settings and application info.</p>
        </header>

        {/* Theme */}
        <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "50ms" }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Palette className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Theme
          </h3>
          <div className="flex gap-3">
            <div className="flex-1 p-3 rounded-lg" style={{ background: "var(--bg-elevated)", border: "1px solid var(--accent-green)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ background: "var(--bg-base)", border: "2px solid var(--accent-green)" }} />
                <span className="font-semibold text-sm" style={{ color: "var(--accent-green)" }}>Dark Mode</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Spotify-inspired dark theme.</p>
            </div>
            <div className="flex-1 p-3 rounded-lg opacity-30 cursor-not-allowed" style={{ background: "var(--bg-elevated)" }}>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded" style={{ background: "#f5f5f5", border: "2px solid #d4d4d4" }} />
                <span className="font-semibold text-sm" style={{ color: "var(--text-muted)" }}>Light Mode</span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Coming soon.</p>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card p-5 mb-4 animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Info className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> About VibeSync
          </h3>
          <div className="space-y-1.5">
            {[
              ["Version", <span key="v" className="badge !text-xs"><Sparkles className="w-2.5 h-2.5" /> v2.0.0</span>],
              ["Framework", "Next.js 16 + Tailwind CSS 4"],
              ["AI Engine", "Ollama LLaVA (Vision Model)"],
              ["Backend", "Spring Boot + FastAPI"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between p-2.5 rounded" style={{ background: "var(--bg-elevated)" }}>
                <span className="text-sm" style={{ color: "var(--text-secondary)" }}>{label}</span>
                {typeof value === "string" ? <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{value}</span> : value}
              </div>
            ))}
          </div>
        </div>

        {/* Developer */}
        <div className="card p-5 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          <h3 className="text-sm font-bold mb-3 flex items-center gap-1.5" style={{ color: "var(--text-primary)" }}>
            <Github className="w-4 h-4" style={{ color: "var(--accent-green)" }} /> Developer
          </h3>
          <div className="flex items-center justify-between p-3 rounded" style={{ background: "var(--bg-elevated)" }}>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>Tanase Stefan-Daniel</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Full-Stack Developer</p>
            </div>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-secondary !text-xs !py-1.5 !px-3 group">
              <Github className="w-3 h-3" /> GitHub <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
