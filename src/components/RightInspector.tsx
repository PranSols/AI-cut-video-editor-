import React from "react";
import { VideoProject, Clip, FilterType, TransitionType, CaptionStyle, FitMode } from "../types/editor";
import { autoSyncBeatsToVideo } from "../utils/audioSynth";
import {
  Sliders,
  Trash2,
  Copy,
  Zap,
  Gauge,
  Sparkles,
  Type,
  Volume2,
  Move,
  Layers,
  Palette,
  Mic,
  Waves,
  Maximize,
} from "lucide-react";

interface RightInspectorProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const RightInspector: React.FC<RightInspectorProps> = ({ project, setProject }) => {
  const selectedClip = project.clips.find((c) => c.id === project.selectedClipId);

  const updateClip = (updates: Partial<Clip>) => {
    if (!project.selectedClipId) return;
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === prev.selectedClipId ? { ...c, ...updates } : c)),
    }));
  };

  const deleteSelectedClip = () => {
    if (!project.selectedClipId) return;
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== prev.selectedClipId),
      selectedClipId: null,
    }));
  };

  const duplicateSelectedClip = () => {
    if (!selectedClip) return;
    const newClip: Clip = {
      ...selectedClip,
      id: "clip_" + Math.random().toString(36).substring(2, 9),
      startTime: selectedClip.startTime + selectedClip.duration + 0.1,
    };
    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
      duration: Math.max(prev.duration, newClip.startTime + newClip.duration),
    }));
  };

  if (!selectedClip) {
    return (
      <aside className="w-72 h-full bg-neutral-900/95 border-l border-neutral-800 flex flex-col shrink-0 select-none overflow-y-auto p-4 text-neutral-400">
        <div className="flex items-center gap-2 text-neutral-200 font-bold text-xs uppercase tracking-wider mb-4">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <span>Project Settings</span>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-neutral-300 font-semibold">Canvas Format</div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Aspect Ratio</span>
              <span className="font-mono text-cyan-400 font-bold">{project.aspectRatio}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Fit Mode</span>
              <span className="capitalize text-neutral-200">{project.fitMode.replace("_", " ")}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Resolution</span>
              <span className="font-mono text-neutral-200">{project.resolution}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Frame Rate</span>
              <span className="font-mono text-neutral-200">{project.fps} FPS</span>
            </div>
          </div>

          <div className="p-3 bg-neutral-950/60 rounded-xl border border-neutral-800 space-y-2">
            <div className="text-neutral-300 font-semibold">Timeline Stats</div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Total Duration</span>
              <span className="font-mono text-neutral-200">{project.duration.toFixed(1)}s</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Total Clips</span>
              <span className="font-mono text-neutral-200">{project.clips.length}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span>Active Tracks</span>
              <span className="font-mono text-neutral-200">{project.tracks.length}</span>
            </div>
          </div>

          <div className="p-3 bg-cyan-950/30 rounded-xl border border-cyan-800/40 text-[11px] text-cyan-200/90 leading-relaxed">
            💡 <strong className="text-cyan-300">AI Cut Pro Tip:</strong> Click any clip on the timeline to edit transitions, audio voice enhancement, noise reduction, and content fit modes!
          </div>

          <div className="p-3 bg-neutral-950/80 rounded-xl border border-neutral-800 text-[11px] text-neutral-400">
            <span>Powered by </span>
            <a
              href="https://shop26.in"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline font-bold"
            >
              shop26.in
            </a>
            <span> · Modern creator tools & accessories.</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 h-full bg-neutral-900/95 border-l border-neutral-800 flex flex-col shrink-0 select-none overflow-y-auto p-3.5 space-y-4">
      {/* Clip Header with title and quick actions */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
        <div className="min-w-0">
          <div className="text-xs font-bold text-white truncate">{selectedClip.title}</div>
          <span className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">
            {selectedClip.type} layer
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={duplicateSelectedClip}
            title="Duplicate Clip"
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={deleteSelectedClip}
            title="Delete Clip"
            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 rounded-md transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TEXT SPECIFIC CONTROLS */}
      {selectedClip.type === "text" && (
        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Subtitle Text
            </label>
            <textarea
              value={selectedClip.text || ""}
              onChange={(e) => updateClip({ text: e.target.value })}
              rows={2}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500 resize-none font-medium"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Style Preset
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(["hormozi", "neon", "minimal", "classic"] as CaptionStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => updateClip({ captionStyle: style })}
                  className={`py-1.5 px-2 text-[11px] font-bold rounded-lg uppercase tracking-wider transition-colors ${
                    selectedClip.captionStyle === style
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/50"
                      : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-neutral-200"
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Highlight Word (Hormozi Pop)
            </label>
            <input
              type="text"
              value={selectedClip.highlightWord || ""}
              onChange={(e) => updateClip({ highlightWord: e.target.value })}
              placeholder="e.g. STOP"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                Highlight Color
              </label>
              <input
                type="color"
                value={selectedClip.highlightColor || "#facc15"}
                onChange={(e) => updateClip({ highlightColor: e.target.value })}
                className="w-full h-8 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer p-0.5"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
                Text Color
              </label>
              <input
                type="color"
                value={selectedClip.textColor || "#ffffff"}
                onChange={(e) => updateClip({ textColor: e.target.value })}
                className="w-full h-8 bg-neutral-950 border border-neutral-800 rounded-lg cursor-pointer p-0.5"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
              <span>Font Size</span>
              <span className="font-mono text-neutral-400">{selectedClip.fontSize || 32}px</span>
            </div>
            <input
              type="range"
              min="16"
              max="64"
              value={selectedClip.fontSize || 32}
              onChange={(e) => updateClip({ fontSize: Number(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* VIDEO & OVERLAY CONTROLS */}
      {(selectedClip.type === "video" || selectedClip.type === "overlay") && (
        <div className="space-y-3.5">
          {/* Fit Mode */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Maximize className="w-3.5 h-3.5 text-cyan-400" />
              <span>Aspect Ratio Fit Mode</span>
            </label>
            <select
              value={selectedClip.fitMode || project.fitMode}
              onChange={(e) => updateClip({ fitMode: e.target.value as FitMode })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="blur_fill">Blurred Mirror Fill (No Cropping)</option>
              <option value="smart_reframe">Smart Reframe (Auto Center)</option>
              <option value="fit">Letterbox / Pillarbox Fit</option>
              <option value="fill">Crop to Fill Frame</option>
            </select>
          </div>

          {/* Speed Ramp */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              <span>Speed Ramp</span>
            </label>
            <div className="grid grid-cols-5 gap-1">
              {[0.5, 1.0, 1.5, 2.0, 3.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => updateClip({ speed: spd })}
                  className={`py-1 text-[11px] font-bold rounded-md transition-colors ${
                    (selectedClip.speed ?? 1.0) === spd
                      ? "bg-cyan-500 text-neutral-950"
                      : "bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white"
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          </div>

          {/* In Transition */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>In Transition</span>
            </label>
            <select
              value={selectedClip.transitionIn || "none"}
              onChange={(e) => updateClip({ transitionIn: e.target.value as TransitionType })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="none">None</option>
              <option value="zoom_in">Zoom In</option>
              <option value="glitch">Glitch Shake</option>
              <option value="whip_pan">Whip Pan</option>
              <option value="flash">White Flash</option>
              <option value="crossfade">Crossfade</option>
              <option value="slide_left">Slide Left</option>
            </select>
          </div>

          {/* Filter LUT */}
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 flex items-center gap-1.5 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-cyan-400" />
              <span>Color Filter LUT</span>
            </label>
            <select
              value={selectedClip.filter || "none"}
              onChange={(e) => updateClip({ filter: e.target.value as FilterType })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-medium"
            >
              <option value="none">Normal (No Filter)</option>
              <option value="cinematic">Cinematic Teal & Orange</option>
              <option value="cyberpunk">Cyberpunk Neon</option>
              <option value="vhs">VHS Analog Retro</option>
              <option value="warm">Golden Hour Warm</option>
              <option value="film">35mm Film Grain</option>
              <option value="noir">Dark Noir B&W</option>
            </select>
          </div>

          {/* Scale Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
              <span>Scale Zoom</span>
              <span className="font-mono text-neutral-400">
                {Math.round((selectedClip.scale ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={selectedClip.scale ?? 1.0}
              onChange={(e) => updateClip({ scale: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
              <span>Opacity</span>
              <span className="font-mono text-neutral-400">
                {Math.round((selectedClip.opacity ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={selectedClip.opacity ?? 1.0}
              onChange={(e) => updateClip({ opacity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* AUDIO CONTROLS & DSP ENHANCEMENT */}
      {selectedClip.type === "audio" && (
        <div className="space-y-3.5">
          {/* Volume */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Volume Gain</span>
              </span>
              <span className="font-mono text-neutral-400">
                {Math.round((selectedClip.volume ?? 0.8) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.5"
              step="0.05"
              value={selectedClip.volume ?? 0.8}
              onChange={(e) => updateClip({ volume: parseFloat(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer"
            />
          </div>

          {/* Noise Reduction Toggle */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Noise Reduction</span>
              </span>
              <input
                type="checkbox"
                checked={selectedClip.noiseReduction ?? true}
                onChange={(e) => updateClip({ noiseReduction: e.target.checked })}
                className="accent-cyan-400 cursor-pointer w-4 h-4"
              />
            </div>
            {(selectedClip.noiseReduction ?? true) && (
              <div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-1">
                  <span>Reduction Amount</span>
                  <span className="font-mono">{selectedClip.noiseReductionLevel ?? 75}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={selectedClip.noiseReductionLevel ?? 75}
                  onChange={(e) => updateClip({ noiseReductionLevel: Number(e.target.value) })}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Voice Clarity Toggle & Presets */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-200 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-purple-400" />
                <span>Voice Enhancement</span>
              </span>
              <input
                type="checkbox"
                checked={selectedClip.voiceEnhance ?? true}
                onChange={(e) => updateClip({ voiceEnhance: e.target.checked })}
                className="accent-purple-400 cursor-pointer w-4 h-4"
              />
            </div>

            {(selectedClip.voiceEnhance ?? true) && (
              <select
                value={selectedClip.voiceEnhancePreset || "studio_mic"}
                onChange={(e) => updateClip({ voiceEnhancePreset: e.target.value as any })}
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-1.5 text-xs text-white focus:outline-none"
              >
                <option value="studio_mic">Studio Broadcast Punch</option>
                <option value="deep_narrator">Deep Voice Narrator</option>
                <option value="crisp_podcast">Crisp Podcast Clarity</option>
                <option value="radio_warmth">Vintage Tube Radio</option>
              </select>
            )}
          </div>

          {/* Auto Beat Sync Tool */}
          <button
            onClick={() => {
              const synced = autoSyncBeatsToVideo(project);
              setProject(synced);
            }}
            className="w-full py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/80 text-emerald-300 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Auto-Sync Cuts to Music Beats</span>
          </button>
        </div>
      )}

      {/* STICKER CONTROLS */}
      {selectedClip.type === "sticker" && (
        <div className="space-y-3.5">
          <div>
            <label className="text-[11px] font-semibold text-neutral-300 block mb-1">
              Sticker Symbol
            </label>
            <input
              type="text"
              value={selectedClip.text || "🔥"}
              onChange={(e) => updateClip({ text: e.target.value })}
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-2.5 py-1.5 text-lg text-center text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-neutral-300 mb-1">
              <span>Size Scale</span>
              <span className="font-mono text-neutral-400">
                {Math.round((selectedClip.scale ?? 1.0) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={selectedClip.scale ?? 1.0}
              onChange={(e) => updateClip({ scale: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Common Timing info */}
      <div className="pt-3 border-t border-neutral-800/80 text-[11px] space-y-1.5 text-neutral-400">
        <div className="flex items-center justify-between">
          <span>Start Point:</span>
          <span className="font-mono text-neutral-200">{selectedClip.startTime.toFixed(2)}s</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Duration:</span>
          <span className="font-mono text-neutral-200">{selectedClip.duration.toFixed(2)}s</span>
        </div>
      </div>
    </aside>
  );
};
