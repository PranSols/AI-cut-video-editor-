import React, { useState } from "react";
import { AspectRatio, FitMode, VideoProject } from "../types/editor";
import {
  Smartphone,
  Tv,
  Square,
  Sparkles,
  Share2,
  Undo2,
  Redo2,
  Film,
  Download,
  Mic,
  ExternalLink,
  ChevronDown,
  Monitor,
} from "lucide-react";

interface HeaderProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenExport: () => void;
  onOpenAiTemplate: () => void;
  onOpenAudioSuite: () => void;
  onOpenMediaAnalyzer: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  project,
  setProject,
  onOpenExport,
  onOpenAiTemplate,
  onOpenAudioSuite,
  onOpenMediaAnalyzer,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(project.title);
  const [isFitMenuOpen, setIsFitMenuOpen] = useState(false);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      setProject((p) => ({ ...p, title: titleInput.trim() }));
    }
  };

  const aspectRatios: { id: AspectRatio; label: string; icon: React.ReactNode; desc: string }[] = [
    { id: "9:16", label: "9:16", icon: <Smartphone className="w-3.5 h-3.5" />, desc: "TikTok / Reels / Shorts" },
    { id: "16:9", label: "16:9", icon: <Tv className="w-3.5 h-3.5" />, desc: "YouTube / Landscape" },
    { id: "1:1", label: "1:1", icon: <Square className="w-3.5 h-3.5" />, desc: "Instagram Square" },
    { id: "4:5", label: "4:5", icon: <Smartphone className="w-3.5 h-3.5" />, desc: "Instagram Portrait" },
    { id: "21:9", label: "21:9", icon: <Monitor className="w-3.5 h-3.5" />, desc: "Ultrawide Cinematic" },
  ];

  const fitModes: { id: FitMode; label: string; desc: string }[] = [
    { id: "blur_fill", label: "Blurred Fill", desc: "No crop or distortion; blurred edges fill frame" },
    { id: "smart_reframe", label: "Smart Reframe", desc: "Intelligently centers visual motion" },
    { id: "fit", label: "Letterbox Fit", desc: "Entire video visible with clean borders" },
    { id: "fill", label: "Crop to Fill", desc: "Fills the entire viewport" },
  ];

  return (
    <header className="h-14 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between gap-3 select-none z-30 shrink-0">
      {/* Brand & Project Info */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Film className="w-4 h-4 text-neutral-950 font-bold" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-base tracking-tight text-white whitespace-nowrap">
              AI Cut
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-1.5 py-0.5 rounded">
              Video Editor
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-neutral-800 hidden sm:block" />

        {/* Project Title Input */}
        <div className="flex items-center gap-2 min-w-0">
          {isEditingTitle ? (
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleTitleSubmit()}
              autoFocus
              className="bg-neutral-800 text-sm font-medium text-white px-2 py-1 rounded border border-cyan-500 focus:outline-none w-44 sm:w-56"
            />
          ) : (
            <button
              onClick={() => {
                setTitleInput(project.title);
                setIsEditingTitle(true);
              }}
              className="text-sm font-medium text-neutral-200 hover:text-white truncate max-w-[120px] sm:max-w-xs hover:bg-neutral-800/60 px-2 py-1 rounded transition-colors text-left"
              title="Click to rename project"
            >
              {project.title}
            </button>
          )}
        </div>
      </div>

      {/* Middle Controls: Aspect Ratio Presets & Fit Mode & Undo/Redo */}
      <div className="hidden lg:flex items-center gap-2">
        {/* Undo / Redo */}
        <div className="flex items-center bg-neutral-950/60 border border-neutral-800 rounded-lg p-0.5">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 rounded transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Aspect Ratio Presets (16:9, 9:16, 1:1, 4:5, 21:9) */}
        <div className="flex items-center bg-neutral-950/60 border border-neutral-800 rounded-lg p-0.5">
          {aspectRatios.map((item) => {
            const isActive = project.aspectRatio === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setProject((p) => ({ ...p, aspectRatio: item.id }))}
                title={item.desc}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? "bg-neutral-800 text-cyan-400 shadow-sm"
                    : "text-neutral-400 hover:text-neutral-200"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Intelligent Content Fit Mode Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsFitMenuOpen((v) => !v)}
            title="Intelligent Aspect Ratio Fit Mode"
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-neutral-950/60 border border-neutral-800 text-cyan-300 rounded-lg hover:border-cyan-800/80 transition-colors"
          >
            <span className="capitalize">{project.fitMode.replace("_", " ")}</span>
            <ChevronDown className="w-3 h-3 text-neutral-400" />
          </button>

          {isFitMenuOpen && (
            <div className="absolute top-full mt-1.5 left-0 w-52 bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
              <div className="text-[10px] font-bold text-neutral-400 px-2 py-1 uppercase tracking-wider">
                Intelligent Content Fit
              </div>
              {fitModes.map((fm) => (
                <button
                  key={fm.id}
                  onClick={() => {
                    setProject((p) => ({ ...p, fitMode: fm.id }));
                    setIsFitMenuOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-lg text-xs transition-colors ${
                    project.fitMode === fm.id
                      ? "bg-cyan-950 text-cyan-300 font-bold"
                      : "text-neutral-300 hover:bg-neutral-800"
                  }`}
                >
                  <div>{fm.label}</div>
                  <div className="text-[10px] text-neutral-400 font-normal leading-tight mt-0.5">
                    {fm.desc}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actions: Audio Suite, Media Analyzer & shop26.in Partner Backlink */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Audio Suite Button */}
        <button
          onClick={onOpenAudioSuite}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700/80 text-emerald-400 text-xs font-semibold rounded-lg border border-emerald-800/50 shadow-sm transition-all whitespace-nowrap"
          title="Audio Noise Reduction, Voice Enhancement & Beat Sync"
        >
          <Mic className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Audio Suite</span>
        </button>

        {/* AI Media Analyzer Button */}
        <button
          onClick={onOpenMediaAnalyzer}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700/80 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-800/50 shadow-sm transition-all whitespace-nowrap"
          title="Analyze input clips & suggest best template"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="hidden sm:inline">AI Matcher</span>
        </button>

        {/* Sponsor/Partner Backlink to shop26.in */}
        <a
          href="https://shop26.in"
          target="_blank"
          rel="noopener noreferrer"
          title="Visit shop26.in for Creator Gear & Trending Essentials"
          className="hidden md:flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-950/80 hover:bg-neutral-800/80 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <span className="text-neutral-400 text-[11px]">Gear:</span>
          <span className="font-semibold text-cyan-300">shop26.in</span>
          <ExternalLink className="w-3 h-3 text-cyan-400/80 ml-0.5" />
        </a>

        {/* Primary CTA: Export & Share */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 text-xs font-bold rounded-lg shadow-md shadow-cyan-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export & Share</span>
        </button>
      </div>
    </header>
  );
};
