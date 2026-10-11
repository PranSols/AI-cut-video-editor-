import React, { useState } from "react";
import { VideoProject, Clip, FilterType, CaptionStyle } from "../types/editor";
import {
  STOCK_SCENES,
  STOCK_AUDIO,
  STOCK_SFX,
  STOCK_STICKERS,
  TEMPLATES,
} from "../utils/stockMedia";
import { playSynthSound } from "../utils/audioSynth";
import {
  LayoutTemplate,
  Film,
  Music,
  Type,
  Wand2,
  Smile,
  Sparkles,
  Plus,
  Play,
  Volume2,
  Clock,
  Layers,
  Upload,
  Zap,
} from "lucide-react";

interface LeftSidebarProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
  onOpenAiTemplate: () => void;
  onOpenAiCaptions: () => void;
  onApplyTemplate: (templateId: string) => void;
  onOpenAudioSuite?: () => void;
  onOpenMediaAnalyzer?: () => void;
}

type TabType = "templates" | "media" | "audio" | "text" | "effects" | "stickers" | "ailab";

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  project,
  setProject,
  onOpenAiTemplate,
  onOpenAiCaptions,
  onApplyTemplate,
  onOpenAudioSuite,
  onOpenMediaAnalyzer,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>("templates");
  const [previewingAudioId, setPreviewingAudioId] = useState<string | null>(null);

  // Helper to add a stock scene to the video track
  const addStockScene = (scene: (typeof STOCK_SCENES)[0]) => {
    // Find current end of video track or current playhead
    const videoClips = project.clips.filter((c) => c.trackId === "track_video");
    const lastClip = videoClips[videoClips.length - 1];
    const startTime = lastClip ? lastClip.startTime + lastClip.duration : 0;

    const newClip: Clip = {
      id: "clip_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_video",
      type: "video",
      title: scene.title,
      startTime,
      duration: scene.duration,
      presetPattern: scene.pattern,
      color: scene.colorStart,
      scale: 1.0,
      speed: 1.0,
      filter: "none",
      transitionIn: "zoom_in",
      transitionDuration: 0.3,
    };

    setProject((prev) => {
      const updatedClips = [...prev.clips, newClip];
      const maxDuration = Math.max(prev.duration, startTime + scene.duration);
      return {
        ...prev,
        clips: updatedClips,
        duration: maxDuration,
        selectedClipId: newClip.id,
      };
    });
  };

  // Helper to add audio track
  const addStockAudio = (audio: (typeof STOCK_AUDIO)[0]) => {
    // remove existing bgm or append
    const newClip: Clip = {
      id: "audio_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_audio",
      type: "audio",
      title: audio.title,
      startTime: 0,
      duration: Math.min(project.duration || 15, audio.duration),
      synthSoundType: audio.synthSoundType,
      volume: 0.8,
      audioCategory: "bgm",
      beatMarkers: audio.beatMarkers,
    };

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips.filter((c) => c.trackId !== "track_audio"), newClip],
      selectedClipId: newClip.id,
    }));
  };

  // Helper to add SFX
  const addStockSFX = (sfx: (typeof STOCK_SFX)[0]) => {
    const newClip: Clip = {
      id: "sfx_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_audio",
      type: "audio",
      title: sfx.name,
      startTime: project.currentTime,
      duration: sfx.duration,
      synthSoundType: sfx.synthType,
      volume: 0.9,
      audioCategory: "sfx",
    };

    playSynthSound(sfx.synthType, 0.9);

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
    }));
  };

  // Helper to add Text
  const addTextPreset = (style: CaptionStyle, initialText: string) => {
    const newClip: Clip = {
      id: "text_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_text",
      type: "text",
      title: "Text Layer",
      startTime: project.currentTime,
      duration: 3.0,
      text: initialText,
      fontSize: 32,
      textColor: "#ffffff",
      highlightWord: initialText.split(" ")[0] || "",
      highlightColor: style === "neon" ? "#06b6d4" : "#eab308",
      captionStyle: style,
      textAlign: "center",
      y: 70,
    };

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
    }));
  };

  // Helper to add Sticker
  const addSticker = (sticker: (typeof STOCK_STICKERS)[0]) => {
    const newClip: Clip = {
      id: "stk_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_sticker",
      type: "sticker",
      title: sticker.label,
      startTime: project.currentTime,
      duration: 2.5,
      text: sticker.symbol,
      fontSize: 44,
      x: 50,
      y: 35,
      scale: 1.0,
    };

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
    }));
  };

  // Apply Filter to selected clip or whole timeline
  const applyFilter = (filter: FilterType) => {
    setProject((prev) => {
      if (prev.selectedClipId) {
        return {
          ...prev,
          clips: prev.clips.map((c) =>
            c.id === prev.selectedClipId ? { ...c, filter, filterIntensity: 0.85 } : c
          ),
        };
      }
      // Apply to all video clips
      return {
        ...prev,
        clips: prev.clips.map((c) =>
          c.trackId === "track_video" ? { ...c, filter, filterIntensity: 0.85 } : c
        ),
      };
    });
  };

  const navTabs = [
    { id: "templates", label: "Templates", icon: LayoutTemplate },
    { id: "media", label: "Media", icon: Film },
    { id: "audio", label: "Audio", icon: Music },
    { id: "text", label: "Text", icon: Type },
    { id: "effects", label: "Effects", icon: Wand2 },
    { id: "stickers", label: "Stickers", icon: Smile },
    { id: "ailab", label: "AI Lab", icon: Sparkles },
  ];

  return (
    <aside className="w-80 h-full bg-neutral-900/95 border-r border-neutral-800 flex flex-col shrink-0 select-none overflow-hidden">
      {/* Top Tab Bar */}
      <div className="flex items-center gap-1 p-1.5 border-b border-neutral-800 bg-neutral-950/40 overflow-x-auto scrollbar-none">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center py-1.5 px-2.5 rounded-lg text-[10px] font-semibold transition-all shrink-0 ${
                isActive
                  ? "bg-neutral-800 text-cyan-400 shadow-sm"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/40"
              }`}
            >
              <Icon className="w-4 h-4 mb-0.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panel */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* TEMPLATES TAB */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {/* AI Generator Banner */}
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-cyan-950 via-neutral-900 to-teal-950 border border-cyan-800/40 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                <span className="text-xs font-bold text-white tracking-wide">
                  Prompt-to-Video AI
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
                Generate complete multi-clip timelines with hook captions, synced audio, and transitions from any idea.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={onOpenAiTemplate}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prompt AI</span>
                </button>
                {onOpenMediaAnalyzer && (
                  <button
                    onClick={onOpenMediaAnalyzer}
                    className="flex-1 py-2 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-800/60 transition-all flex items-center justify-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Match Clips</span>
                  </button>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">AI Cut Trending Templates</span>
                <span className="text-[10px] text-neutral-500">{TEMPLATES.length} Presets</span>
              </div>

              <div className="space-y-2.5">
                {TEMPLATES.map((tpl) => (
                  <div
                    key={tpl.id}
                    className="p-3 bg-neutral-950/70 border border-neutral-800 hover:border-cyan-800/60 rounded-xl transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {tpl.name}
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-1.5 py-0.5 rounded">
                        {tpl.duration}s · {tpl.aspectRatio}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed mb-2.5">
                      {tpl.description}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/60">
                      <span className="text-[10px] text-neutral-500 truncate max-w-[150px]">
                        🎵 {tpl.musicTitle}
                      </span>
                      <button
                        onClick={() => onApplyTemplate(tpl.id)}
                        className="px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 hover:text-cyan-200 border border-cyan-500/30 text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Apply</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* MEDIA TAB */}
        {activeTab === "media" && (
          <div className="space-y-4">
            {/* Custom file upload simulation */}
            <div className="border border-dashed border-neutral-700 hover:border-cyan-500/50 rounded-xl p-4 text-center transition-colors bg-neutral-950/40 group cursor-pointer">
              <Upload className="w-6 h-6 text-neutral-500 group-hover:text-cyan-400 mx-auto mb-1.5 transition-colors" />
              <div className="text-xs font-semibold text-neutral-300 group-hover:text-white">
                Upload Video or B-Roll
              </div>
              <div className="text-[10px] text-neutral-500 mt-0.5">MP4, WebM, PNG, JPG up to 4K</div>
              <input
                type="file"
                accept="video/*,image/*"
                className="hidden"
                id="media-file-input"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    const newClip: Clip = {
                      id: "upload_" + Date.now(),
                      trackId: "track_video",
                      type: "video",
                      title: file.name.substring(0, 18),
                      startTime: project.currentTime,
                      duration: 4.0,
                      mediaUrl: url,
                      color: "#1e293b",
                      scale: 1.0,
                      speed: 1.0,
                    };
                    setProject((p) => ({
                      ...p,
                      clips: [...p.clips, newClip],
                      selectedClipId: newClip.id,
                    }));
                  }
                }}
              />
              <label
                htmlFor="media-file-input"
                className="mt-2.5 inline-block px-3 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg cursor-pointer"
              >
                Browse Files
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">Stock Footage & Motion</span>
                <span className="text-[10px] text-neutral-500">6 Clips</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {STOCK_SCENES.map((scene) => (
                  <div
                    key={scene.id}
                    className="group relative rounded-lg border border-neutral-800 overflow-hidden bg-neutral-950 hover:border-cyan-800 transition-all cursor-pointer"
                    onClick={() => addStockScene(scene)}
                  >
                    <div
                      className="h-20 w-full flex items-center justify-center p-2 relative"
                      style={{
                        background: `linear-gradient(135deg, ${scene.colorStart}, ${scene.colorEnd})`,
                      }}
                    >
                      <div className="absolute inset-0 bg-neutral-950/25 group-hover:bg-neutral-950/10 transition-colors" />
                      <div className="relative text-center">
                        <span className="text-[10px] font-bold text-white uppercase tracking-wider drop-shadow">
                          {scene.tag}
                        </span>
                      </div>
                      <div className="absolute bottom-1 right-1.5 text-[9px] font-mono text-white/80 bg-neutral-950/60 px-1 rounded">
                        {scene.duration}s
                      </div>
                    </div>
                    <div className="p-2 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-300 truncate">
                        {scene.title}
                      </span>
                      <Plus className="w-3.5 h-3.5 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AUDIO & SFX TAB */}
        {activeTab === "audio" && (
          <div className="space-y-4">
            {/* Audio Studio Banner */}
            <div className="p-3.5 bg-gradient-to-br from-emerald-950/70 via-neutral-900 to-teal-950/70 border border-emerald-800/50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Advanced Audio Suite</span>
                </span>
                <span className="text-[10px] text-emerald-400 font-mono">Denoise · Clarity</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Background noise removal, vocal clarity enhancer, and 1-click automatic beat-to-video alignment.
              </p>
              {onOpenAudioSuite && (
                <button
                  onClick={onOpenAudioSuite}
                  className="w-full py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg shadow transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Open Audio Studio</span>
                </button>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">Trending Soundtracks</span>
                <span className="text-[10px] text-neutral-500">Beat Synced</span>
              </div>

              <div className="space-y-2">
                {STOCK_AUDIO.map((audio) => (
                  <div
                    key={audio.id}
                    className="p-2.5 bg-neutral-950/70 border border-neutral-800 hover:border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        onClick={() => {
                          setPreviewingAudioId(audio.id);
                          playSynthSound(audio.synthSoundType, 0.8);
                        }}
                        className="w-8 h-8 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 transition-colors"
                        title="Listen preview"
                      >
                        <Play className="w-3.5 h-3.5 ml-0.5" />
                      </button>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate">{audio.title}</div>
                        <div className="text-[10px] text-neutral-400 truncate">
                          {audio.artist} · <span className="text-emerald-400">{audio.bpm} BPM</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => addStockAudio(audio)}
                      className="px-2 py-1 bg-neutral-800 hover:bg-emerald-600 hover:text-white text-neutral-300 text-[11px] font-semibold rounded-md transition-all shrink-0 flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Use</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">Sound Effects (SFX)</span>
                <span className="text-[10px] text-neutral-500">Instant Hits</span>
              </div>

              <div className="grid grid-cols-1 gap-1.5">
                {STOCK_SFX.map((sfx) => (
                  <div
                    key={sfx.id}
                    className="p-2 bg-neutral-950/60 border border-neutral-800/80 hover:border-neutral-700 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="text-neutral-200 font-medium">{sfx.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => playSynthSound(sfx.synthType, 0.85)}
                        className="px-2 py-0.5 text-[10px] text-neutral-400 hover:text-white bg-neutral-800 rounded transition-colors"
                      >
                        Test
                      </button>
                      <button
                        onClick={() => addStockSFX(sfx)}
                        className="px-2 py-0.5 text-[10px] font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 rounded hover:bg-cyan-900/60 transition-colors flex items-center gap-0.5"
                      >
                        <Plus className="w-2.5 h-2.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TEXT & CAPTIONS TAB */}
        {activeTab === "text" && (
          <div className="space-y-4">
            {/* AI Auto-Captions Button */}
            <div className="p-3.5 bg-gradient-to-br from-purple-950/80 via-neutral-900 to-cyan-950/80 border border-purple-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">AI Auto-Captions</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed mb-3">
                Generate synced Hormozi-style viral karaoke subtitles with animated yellow highlights in 1-click.
              </p>
              <button
                onClick={onOpenAiCaptions}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Generate Auto-Captions</span>
              </button>
            </div>

            <div>
              <div className="text-xs font-bold text-neutral-200 mb-2">Preset Caption Styles</div>
              <div className="space-y-2">
                <button
                  onClick={() => addTextPreset("hormozi", "STOP SCROLLING 🚨")}
                  className="w-full p-2.5 bg-neutral-950/80 border border-neutral-800 hover:border-yellow-500/50 rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-black text-white tracking-wider">
                      HORMOZI <span className="text-yellow-400">VIRAL</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">High-retention highlight box</div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  onClick={() => addTextPreset("neon", "CYBER GLOW TITLE")}
                  className="w-full p-2.5 bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-cyan-300 tracking-wider">
                      NEON GLOW
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Vibrant pulse shadow</div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400" />
                </button>

                <button
                  onClick={() => addTextPreset("minimal", "Aesthetic minimal caption")}
                  className="w-full p-2.5 bg-neutral-950/80 border border-neutral-800 hover:border-neutral-600 rounded-xl text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-semibold text-neutral-200">
                      Minimal Clean
                    </div>
                    <div className="text-[10px] text-neutral-400 mt-0.5">Subtle aesthetic lower-third</div>
                  </div>
                  <Plus className="w-3.5 h-3.5 text-neutral-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EFFECTS & FILTERS TAB */}
        {activeTab === "effects" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">Color Grade Filters</span>
                <span className="text-[10px] text-neutral-500">Real-Time LUTs</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "cinematic", name: "Teal & Orange", color: "from-teal-600 to-orange-500" },
                  { id: "cyberpunk", name: "Cyber Neon", color: "from-fuchsia-600 to-cyan-500" },
                  { id: "vhs", name: "VHS Analog", color: "from-purple-800 to-blue-700" },
                  { id: "warm", name: "Golden Hour", color: "from-amber-600 to-red-500" },
                  { id: "film", name: "35mm Film", color: "from-stone-700 to-amber-800" },
                  { id: "noir", name: "Dark Noir", color: "from-neutral-950 to-neutral-800" },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    onClick={() => applyFilter(flt.id as FilterType)}
                    className="p-2.5 bg-neutral-950 border border-neutral-800 hover:border-cyan-500/50 rounded-xl text-left transition-all group"
                  >
                    <div
                      className={`h-10 w-full rounded-lg bg-gradient-to-r ${flt.color} mb-2 shadow-inner`}
                    />
                    <div className="text-xs font-bold text-white group-hover:text-cyan-300">
                      {flt.name}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STICKERS TAB */}
        {activeTab === "stickers" && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-neutral-200">Viral Reactions & Badges</span>
                <span className="text-[10px] text-neutral-500">Interactive</span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {STOCK_STICKERS.map((stk) => (
                  <button
                    key={stk.id}
                    onClick={() => addSticker(stk)}
                    className="p-3 bg-neutral-950/80 border border-neutral-800 hover:border-cyan-500/50 rounded-xl flex flex-col items-center justify-center gap-1 transition-all group hover:scale-105"
                  >
                    <span className="text-2xl drop-shadow">{stk.symbol}</span>
                    <span className="text-[10px] font-medium text-neutral-400 group-hover:text-white truncate">
                      {stk.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* AI LAB TAB */}
        {activeTab === "ailab" && (
          <div className="space-y-3">
            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">AI Script to Storyboard</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Transform any topic into a 3-part viral video structure (Hook, Value, CTA) with calculated pacing.
              </p>
              <button
                onClick={onOpenAiTemplate}
                className="w-full py-1.5 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/60 text-xs font-bold rounded-lg transition-colors"
              >
                Open Generator
              </button>
            </div>

            <div className="p-3.5 bg-neutral-950 border border-neutral-800 rounded-xl space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Auto Beat Sync</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Snap clip cut points directly to musical downbeats (130 BPM / 85 BPM) for seamless rhythm.
              </p>
              <button
                onClick={() => {
                  // Beat sync cuts across main video track
                  const audioClip = project.clips.find((c) => c.trackId === "track_audio" && c.beatMarkers);
                  if (audioClip && audioClip.beatMarkers && audioClip.beatMarkers.length > 2) {
                    const markers = audioClip.beatMarkers;
                    const videoClips = project.clips.filter((c) => c.trackId === "track_video");
                    let markerIdx = 0;
                    const synced = videoClips.map((vc) => {
                      const startTime = markers[markerIdx] || vc.startTime;
                      const nextMarker = markers[markerIdx + 2] || startTime + 3;
                      markerIdx += 2;
                      return { ...vc, startTime, duration: nextMarker - startTime };
                    });
                    setProject((prev) => ({
                      ...prev,
                      clips: prev.clips.map((c) => {
                        const found = synced.find((s) => s.id === c.id);
                        return found || c;
                      }),
                    }));
                  }
                }}
                className="w-full py-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-800/60 text-xs font-bold rounded-lg transition-colors"
              >
                Auto-Snap Cuts to Beats
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
