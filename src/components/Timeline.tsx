import React, { useRef, useState, useEffect } from "react";
import { VideoProject, Clip, Track } from "../types/editor";
import {
  Scissors,
  Trash2,
  Copy,
  Magnet,
  ZoomIn,
  ZoomOut,
  Type,
  Smile,
  Film,
  Music,
  Layers,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Lock,
  Unlock,
} from "lucide-react";

interface TimelineProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const Timeline: React.FC<TimelineProps> = ({ project, setProject }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lanesRef = useRef<HTMLDivElement | null>(null);

  // Pixels per second (zoom level)
  const [pixelsPerSec, setPixelsPerSec] = useState(48); // 20 to 120
  const [isSnapping, setIsSnapping] = useState(true);

  // Playhead dragging state
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Clip drag / trim state
  const [draggingClipId, setDraggingClipId] = useState<string | null>(null);
  const [trimmingClip, setTrimmingClip] = useState<{ id: string; side: "left" | "right"; initialStart: number; initialDuration: number; startX: number } | null>(null);
  const [clipDragOffset, setClipDragOffset] = useState<number>(0);

  // Split Clip at current playhead
  const handleSplitClip = () => {
    const activeClip = project.clips.find(
      (c) =>
        c.trackId === "track_video" &&
        project.currentTime > c.startTime + 0.2 &&
        project.currentTime < c.startTime + c.duration - 0.2
    );

    if (!activeClip) return;

    const firstDuration = project.currentTime - activeClip.startTime;
    const secondDuration = activeClip.duration - firstDuration;

    const clip1: Clip = {
      ...activeClip,
      duration: firstDuration,
    };

    const clip2: Clip = {
      ...activeClip,
      id: "clip_" + Math.random().toString(36).substring(2, 9),
      title: activeClip.title + " (Part 2)",
      startTime: project.currentTime,
      duration: secondDuration,
      transitionIn: "none",
    };

    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => (c.id === activeClip.id ? clip1 : c)).concat(clip2),
      selectedClipId: clip2.id,
    }));
  };

  // Delete selected clip
  const handleDeleteSelected = () => {
    if (!project.selectedClipId) return;
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.filter((c) => c.id !== prev.selectedClipId),
      selectedClipId: null,
    }));
  };

  // Duplicate selected clip
  const handleDuplicateSelected = () => {
    const selected = project.clips.find((c) => c.id === project.selectedClipId);
    if (!selected) return;

    const newClip: Clip = {
      ...selected,
      id: "clip_" + Math.random().toString(36).substring(2, 9),
      startTime: selected.startTime + selected.duration + 0.1,
    };

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips, newClip],
      selectedClipId: newClip.id,
      duration: Math.max(prev.duration, newClip.startTime + newClip.duration),
    }));
  };

  // Scrubbing on timeline ruler or lanes
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!lanesRef.current) return;
    const rect = lanesRef.current.getBoundingClientRect();
    const scrollLeft = lanesRef.current.scrollLeft;
    const clickX = e.clientX - rect.left + scrollLeft;
    const targetTime = Math.max(0, Math.min(project.duration, clickX / pixelsPerSec));

    setProject((p) => ({ ...p, currentTime: targetTime, isPlaying: false }));
    setIsScrubbing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrubbing && lanesRef.current) {
        const rect = lanesRef.current.getBoundingClientRect();
        const scrollLeft = lanesRef.current.scrollLeft;
        const clickX = e.clientX - rect.left + scrollLeft;
        let targetTime = Math.max(0, Math.min(project.duration, clickX / pixelsPerSec));

        // Snap to beats or clip bounds if enabled
        if (isSnapping) {
          const snapPoints: number[] = [0, project.duration];
          project.clips.forEach((c) => {
            snapPoints.push(c.startTime, c.startTime + c.duration);
            if (c.beatMarkers) snapPoints.push(...c.beatMarkers);
          });

          for (const sp of snapPoints) {
            if (Math.abs(targetTime - sp) < 0.15) {
              targetTime = sp;
              break;
            }
          }
        }

        setProject((p) => ({ ...p, currentTime: targetTime }));
      }

      // Handle clip trimming
      if (trimmingClip) {
        const deltaX = e.clientX - trimmingClip.startX;
        const deltaSec = deltaX / pixelsPerSec;

        setProject((prev) => ({
          ...prev,
          clips: prev.clips.map((c) => {
            if (c.id !== trimmingClip.id) return c;
            if (trimmingClip.side === "right") {
              const newDur = Math.max(0.4, trimmingClip.initialDuration + deltaSec);
              return { ...c, duration: newDur };
            } else {
              const newStart = Math.max(0, trimmingClip.initialStart + deltaSec);
              const newDur = Math.max(0.4, trimmingClip.initialDuration - deltaSec);
              return { ...c, startTime: newStart, duration: newDur };
            }
          }),
        }));
      }
    };

    const handleMouseUp = () => {
      if (isScrubbing) setIsScrubbing(false);
      if (trimmingClip) setTrimmingClip(null);
      if (draggingClipId) setDraggingClipId(null);
    };

    if (isScrubbing || trimmingClip || draggingClipId) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isScrubbing, trimmingClip, draggingClipId, pixelsPerSec, isSnapping, project.duration, setProject]);

  // Timeline track definitions
  const tracks: { id: string; label: string; icon: any; color: string }[] = [
    { id: "track_text", label: "Captions", icon: Type, color: "text-purple-400" },
    { id: "track_sticker", label: "Stickers", icon: Smile, color: "text-pink-400" },
    { id: "track_overlay", label: "Overlay", icon: Layers, color: "text-amber-400" },
    { id: "track_video", label: "Main Video", icon: Film, color: "text-cyan-400" },
    { id: "track_audio", label: "Audio & Beats", icon: Music, color: "text-emerald-400" },
  ];

  // Ruler markers array
  const totalSeconds = Math.ceil(project.duration) + 3;
  const rulerTicks = Array.from({ length: totalSeconds + 1 }, (_, i) => i);

  // Audio beat markers for visible vertical indicators
  const audioClip = project.clips.find((c) => c.trackId === "track_audio" && c.beatMarkers);
  const beatMarkers = audioClip?.beatMarkers || [];

  return (
    <div
      ref={containerRef}
      className="h-72 bg-neutral-900 border-t border-neutral-800 flex flex-col select-none shrink-0"
    >
      {/* Timeline Controls Toolbar */}
      <div className="h-10 bg-neutral-950/70 border-b border-neutral-800 px-3 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSplitClip}
            title="Split Clip at Playhead (Ctrl+B)"
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-md transition-colors"
          >
            <Scissors className="w-3.5 h-3.5 text-cyan-400" />
            <span>Split</span>
          </button>

          <button
            onClick={handleDuplicateSelected}
            disabled={!project.selectedClipId}
            title="Duplicate Selected Clip"
            className="p-1.5 text-neutral-400 hover:text-white disabled:opacity-30 rounded-md hover:bg-neutral-800 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={handleDeleteSelected}
            disabled={!project.selectedClipId}
            title="Delete Selected Clip"
            className="p-1.5 text-neutral-400 hover:text-red-400 disabled:opacity-30 rounded-md hover:bg-neutral-800 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-3.5 w-px bg-neutral-800 mx-1" />

          {/* Snapping Toggle */}
          <button
            onClick={() => setIsSnapping((v) => !v)}
            title="Magnetic Snapping"
            className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
              isSnapping
                ? "bg-cyan-950/60 text-cyan-300 border border-cyan-800/60"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Magnet className="w-3.5 h-3.5" />
            <span className="text-[11px]">Snap</span>
          </button>
        </div>

        {/* Timeline Zoom Slider */}
        <div className="flex items-center gap-2">
          <ZoomOut className="w-3.5 h-3.5 text-neutral-500" />
          <input
            type="range"
            min="20"
            max="120"
            value={pixelsPerSec}
            onChange={(e) => setPixelsPerSec(Number(e.target.value))}
            className="w-24 accent-cyan-400 cursor-pointer h-1"
          />
          <ZoomIn className="w-3.5 h-3.5 text-neutral-500" />
        </div>
      </div>

      {/* Timeline Grid (Track Headers Left + Lanes Right) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left: Track Headers (Sticky) */}
        <div className="w-40 bg-neutral-950/80 border-r border-neutral-800 shrink-0 flex flex-col pt-7 select-none">
          {tracks.map((track) => {
            const Icon = track.icon;
            return (
              <div
                key={track.id}
                className="h-10 px-3 flex items-center justify-between border-b border-neutral-800/60 text-xs font-medium text-neutral-300"
              >
                <div className="flex items-center gap-2 truncate">
                  <Icon className={`w-3.5 h-3.5 ${track.color} shrink-0`} />
                  <span className="truncate text-[11px] font-semibold">{track.label}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Scrollable Lanes with Ruler & Playhead */}
        <div
          ref={lanesRef}
          onMouseDown={handleTimelineMouseDown}
          className="flex-1 relative overflow-x-auto overflow-y-hidden bg-neutral-950/40 cursor-crosshair"
        >
          <div
            className="relative h-full"
            style={{ width: `${totalSeconds * pixelsPerSec}px`, minWidth: "100%" }}
          >
            {/* Top Ruler */}
            <div className="h-7 border-b border-neutral-800 bg-neutral-950/80 flex items-center relative select-none">
              {rulerTicks.map((sec) => (
                <div
                  key={sec}
                  className="absolute top-0 bottom-0 flex flex-col justify-end"
                  style={{ left: `${sec * pixelsPerSec}px` }}
                >
                  <span className="text-[9px] font-mono font-medium text-neutral-500 pl-1 pb-1">
                    {sec}s
                  </span>
                  <div className="w-px h-2 bg-neutral-700" />
                </div>
              ))}

              {/* Beat markers on ruler */}
              {beatMarkers.map((bm, idx) => (
                <div
                  key={idx}
                  className="absolute top-1 w-1.5 h-1.5 rounded-full bg-yellow-400 shadow-sm"
                  style={{ left: `${bm * pixelsPerSec - 3}px` }}
                  title={`Beat: ${bm.toFixed(2)}s`}
                />
              ))}
            </div>

            {/* Red Playhead Vertical Needle */}
            <div
              className="absolute top-0 bottom-0 w-px bg-rose-500 z-30 pointer-events-none shadow-[0_0_8px_rgba(244,63,94,0.8)]"
              style={{ left: `${project.currentTime * pixelsPerSec}px` }}
            >
              {/* Playhead Handle Head */}
              <div className="w-3.5 h-4 bg-rose-500 rounded-b-sm -translate-x-[6px] shadow-md flex items-center justify-center">
                <div className="w-1 h-2 bg-white/80 rounded-full" />
              </div>
            </div>

            {/* Track Lanes */}
            <div className="flex flex-col">
              {tracks.map((track) => {
                const trackClips = project.clips.filter((c) => c.trackId === track.id);

                return (
                  <div
                    key={track.id}
                    className="h-10 border-b border-neutral-800/40 relative flex items-center"
                  >
                    {/* Render clips on this track */}
                    {trackClips.map((clip) => {
                      const isSelected = project.selectedClipId === clip.id;
                      const clipLeft = clip.startTime * pixelsPerSec;
                      const clipWidth = Math.max(16, clip.duration * pixelsPerSec);

                      return (
                        <div
                          key={clip.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setProject((p) => ({ ...p, selectedClipId: clip.id }));
                          }}
                          className={`absolute h-8 rounded-lg flex items-center justify-between px-2 text-xs font-semibold transition-all cursor-pointer group shadow-sm overflow-hidden select-none ${
                            clip.type === "video"
                              ? "bg-gradient-to-r from-cyan-950 to-blue-950 text-cyan-200 border border-cyan-800/80"
                              : clip.type === "text"
                              ? "bg-gradient-to-r from-purple-950 to-indigo-950 text-purple-200 border border-purple-800/80"
                              : clip.type === "sticker"
                              ? "bg-gradient-to-r from-pink-950 to-rose-950 text-pink-200 border border-pink-800/80"
                              : clip.type === "audio"
                              ? "bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-200 border border-emerald-800/80"
                              : "bg-neutral-800 text-neutral-200 border border-neutral-700"
                          } ${
                            isSelected
                              ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-neutral-950 z-20"
                              : "hover:border-neutral-500"
                          }`}
                          style={{
                            left: `${clipLeft}px`,
                            width: `${clipWidth}px`,
                          }}
                        >
                          {/* Left Trim Handle */}
                          {isSelected && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setTrimmingClip({
                                  id: clip.id,
                                  side: "left",
                                  initialStart: clip.startTime,
                                  initialDuration: clip.duration,
                                  startX: e.clientX,
                                });
                              }}
                              className="absolute left-0 top-0 bottom-0 w-2.5 bg-cyan-400 cursor-ew-resize flex items-center justify-center opacity-80 hover:opacity-100 z-30"
                            >
                              <div className="w-0.5 h-3 bg-neutral-950 rounded-full" />
                            </div>
                          )}

                          {/* Clip Content label & icon */}
                          <div className="truncate flex items-center gap-1.5 min-w-0 pr-1">
                            {clip.type === "sticker" && <span className="text-sm">{clip.text}</span>}
                            <span className="truncate text-[11px] font-bold">
                              {clip.type === "text" ? `"${clip.text}"` : clip.title}
                            </span>
                            {clip.transitionIn && clip.transitionIn !== "none" && (
                              <span className="text-[9px] bg-black/40 px-1 rounded text-cyan-300 font-mono">
                                ⚡ {clip.transitionIn}
                              </span>
                            )}
                          </div>

                          {/* Waveform graphic for audio clips */}
                          {clip.type === "audio" && (
                            <div className="flex items-center gap-0.5 opacity-60">
                              {[30, 80, 50, 100, 40, 90, 60, 45, 95].map((h, i) => (
                                <div
                                  key={i}
                                  className="w-0.5 bg-emerald-400 rounded-full"
                                  style={{ height: `${h * 0.18}px` }}
                                />
                              ))}
                            </div>
                          )}

                          {/* Right Trim Handle */}
                          {isSelected && (
                            <div
                              onMouseDown={(e) => {
                                e.stopPropagation();
                                setTrimmingClip({
                                  id: clip.id,
                                  side: "right",
                                  initialStart: clip.startTime,
                                  initialDuration: clip.duration,
                                  startX: e.clientX,
                                });
                              }}
                              className="absolute right-0 top-0 bottom-0 w-2.5 bg-cyan-400 cursor-ew-resize flex items-center justify-center opacity-80 hover:opacity-100 z-30"
                            >
                              <div className="w-0.5 h-3 bg-neutral-950 rounded-full" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
