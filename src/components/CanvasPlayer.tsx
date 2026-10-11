import React, { useRef, useEffect, useState, useCallback } from "react";
import { VideoProject } from "../types/editor";
import { renderFrame, getResolutionDimensions } from "../utils/canvasRenderer";
import { playSynthSound } from "../utils/audioSynth";
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Maximize2,
  Volume2,
  VolumeX,
  ShieldAlert,
  Repeat,
} from "lucide-react";

interface CanvasPlayerProps {
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const CanvasPlayer: React.FC<CanvasPlayerProps> = ({ project, setProject }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showSafeGuides, setShowSafeGuides] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(true);
  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  // Play audio triggers on timeline progress
  const lastTriggeredSecondRef = useRef<number>(-1);

  // Redraw canvas whenever project state or currentTime changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    renderFrame(ctx, project, project.currentTime, {
      showGuides: showSafeGuides,
    });
  }, [project, showSafeGuides]);

  // Playback animation loop
  useEffect(() => {
    if (!project.isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }

    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const deltaSec = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setProject((prev) => {
        if (!prev.isPlaying) return prev;

        let nextTime = prev.currentTime + deltaSec;

        // Check audio cues on current second hit
        const currentSecInt = Math.floor(nextTime);
        if (currentSecInt !== lastTriggeredSecondRef.current && !isMuted) {
          lastTriggeredSecondRef.current = currentSecInt;
          const activeAudio = prev.clips.find(
            (c) => c.type === "audio" && nextTime >= c.startTime && nextTime < c.startTime + c.duration
          );
          if (activeAudio?.synthSoundType) {
            playSynthSound(activeAudio.synthSoundType, (activeAudio.volume ?? 0.8) * 0.5);
          }
        }

        // Loop or stop condition
        if (nextTime >= prev.duration) {
          if (isLooping) {
            nextTime = 0;
          } else {
            return { ...prev, currentTime: prev.duration, isPlaying: false };
          }
        }

        return { ...prev, currentTime: nextTime };
      });

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [project.isPlaying, isLooping, isMuted, setProject]);

  // Keyboard shortcut: Spacebar to toggle Play/Pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === "Space") {
        e.preventDefault();
        togglePlayPause();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const togglePlayPause = useCallback(() => {
    setProject((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  }, [setProject]);

  const stepBackward = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      currentTime: Math.max(0, prev.currentTime - 1),
    }));
  }, [setProject]);

  const stepForward = useCallback(() => {
    setProject((prev) => ({
      ...prev,
      currentTime: Math.min(prev.duration, prev.currentTime + 1),
    }));
  }, [setProject]);

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch((err) => console.log(err));
      } else {
        document.exitFullscreen().catch((err) => console.log(err));
      }
    }
  };

  // Format time helper 00:04.12
  const formatTimecode = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 100);
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(ms).padStart(2, "0")}`;
  };

  // Dimensions based on aspect ratio
  const { width: renderW, height: renderH } = getResolutionDimensions(project.aspectRatio, "1080p");

  return (
    <div
      ref={containerRef}
      className="flex-1 h-full bg-neutral-950 flex flex-col items-center justify-between p-3 select-none relative overflow-hidden"
    >
      {/* Top Overlay bar (Pill: Current Aspect & Resolution) */}
      <div className="w-full flex items-center justify-between px-2 pt-1 text-[11px] text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300">{project.aspectRatio}</span>
          <span>·</span>
          <span className="capitalize text-cyan-400">{project.fitMode.replace("_", " ")}</span>
          <span>·</span>
          <span>{project.resolution} 30FPS</span>
        </div>

        {/* Safe Guides Toggle */}
        <button
          onClick={() => setShowSafeGuides((v) => !v)}
          title="Toggle TikTok / Reels Safe Margin UI"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
            showSafeGuides
              ? "bg-cyan-950 text-cyan-300 border border-cyan-800/60"
              : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Social Safe Zones</span>
        </button>
      </div>

      {/* Center Canvas Viewport */}
      <div className="flex-1 w-full flex items-center justify-center p-2 relative min-h-0">
        <div
          className="relative max-h-full max-w-full rounded-lg shadow-2xl overflow-hidden border border-neutral-800 bg-neutral-900 flex items-center justify-center"
          style={{
            aspectRatio:
              project.aspectRatio === "9:16"
                ? "9/16"
                : project.aspectRatio === "16:9"
                ? "16/9"
                : project.aspectRatio === "21:9"
                ? "21/9"
                : project.aspectRatio === "4:5"
                ? "4/5"
                : "1/1",
            height: project.aspectRatio === "9:16" ? "92%" : project.aspectRatio === "4:5" ? "88%" : "auto",
            width: project.aspectRatio === "21:9" ? "96%" : project.aspectRatio === "16:9" ? "88%" : "auto",
          }}
        >
          <canvas
            ref={canvasRef}
            width={renderW}
            height={renderH}
            className="w-full h-full object-contain cursor-pointer"
            onClick={togglePlayPause}
          />
        </div>
      </div>

      {/* Bottom Transport Controls Bar */}
      <div className="w-full max-w-xl bg-neutral-900/90 border border-neutral-800/90 backdrop-blur-md rounded-xl px-4 py-2 flex items-center justify-between gap-4 shadow-lg shrink-0">
        {/* Left: Timecode */}
        <div className="flex items-center gap-1 font-mono text-xs font-semibold tabular-nums text-neutral-200">
          <span className="text-cyan-400">{formatTimecode(project.currentTime)}</span>
          <span className="text-neutral-600">/</span>
          <span className="text-neutral-400">{formatTimecode(project.duration)}</span>
        </div>

        {/* Center: Play/Pause/Steps */}
        <div className="flex items-center gap-2">
          <button
            onClick={stepBackward}
            title="Step Back 1s"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          <button
            onClick={togglePlayPause}
            title="Play / Pause (Space)"
            className="w-9 h-9 rounded-full bg-cyan-500 hover:bg-cyan-400 text-neutral-950 flex items-center justify-center shadow-md shadow-cyan-500/25 transition-all hover:scale-105 active:scale-95"
          >
            {project.isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={stepForward}
            title="Step Forward 1s"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Loop, Volume & Fullscreen */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLooping((v) => !v)}
            title={isLooping ? "Loop On" : "Loop Off"}
            className={`p-1.5 rounded-lg transition-colors ${
              isLooping ? "text-cyan-400 bg-cyan-950/60" : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsMuted((v) => !v)}
            title={isMuted ? "Unmute" : "Mute"}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleFullscreen}
            title="Fullscreen"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
