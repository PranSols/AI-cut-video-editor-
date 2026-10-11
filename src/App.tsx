import React, { useState, useEffect, useRef } from "react";
import { VideoProject, Clip, Track } from "./types/editor";
import { TEMPLATES } from "./utils/stockMedia";
import { Header } from "./components/Header";
import { LeftSidebar } from "./components/LeftSidebar";
import { CanvasPlayer } from "./components/CanvasPlayer";
import { RightInspector } from "./components/RightInspector";
import { Timeline } from "./components/Timeline";
import { ExportModal } from "./components/ExportModal";
import { AiTemplateModal } from "./components/AiTemplateModal";
import { AiCaptionsModal } from "./components/AiCaptionsModal";
import { AudioSuiteModal } from "./components/AudioSuiteModal";
import { AiMediaAnalyzerModal } from "./components/AiMediaAnalyzerModal";

// Initial Project Tracks
const INITIAL_TRACKS: Track[] = [
  { id: "track_text", type: "text", name: "Captions", muted: false, locked: false },
  { id: "track_sticker", type: "sticker", name: "Stickers", muted: false, locked: false },
  { id: "track_overlay", type: "overlay", name: "Overlay", muted: false, locked: false },
  { id: "track_video", type: "video", name: "Main Video", muted: false, locked: false },
  { id: "track_audio", type: "audio", name: "Audio & Beats", muted: false, locked: false },
];

export default function App() {
  // Initialize with the trending template
  const defaultTemplate = TEMPLATES[0];

  const [project, setProject] = useState<VideoProject>(() => {
    const clipsWithIds: Clip[] = defaultTemplate.clips.map((c, i) => ({
      ...c,
      id: "clip_init_" + i,
    }));

    return {
      id: "proj_1",
      title: "AI Cut Reel - Hook 01",
      aspectRatio: defaultTemplate.aspectRatio,
      fitMode: "blur_fill",
      duration: defaultTemplate.duration,
      currentTime: 0,
      isPlaying: false,
      fps: 30,
      resolution: "1080p",
      tracks: INITIAL_TRACKS,
      clips: clipsWithIds,
      selectedClipId: clipsWithIds[0]?.id || null,
    };
  });

  // Undo / Redo history
  const [history, setHistory] = useState<VideoProject[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isUndoRedoAction = useRef(false);

  // Push history on meaningful clip modifications
  const saveStateToHistory = (newProject: VideoProject) => {
    if (isUndoRedoAction.current) {
      isUndoRedoAction.current = false;
      return;
    }
    setHistory((prev) => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent.slice(-20), newProject];
    });
    setHistoryIndex((prev) => Math.min(20, prev + 1));
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex - 1];
      setHistoryIndex((i) => i - 1);
      setProject(target);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const target = history[historyIndex + 1];
      setHistoryIndex((i) => i + 1);
      setProject(target);
    }
  };

  // Keyboard shortcut for Undo / Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        handleRedo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAiTemplateOpen, setIsAiTemplateOpen] = useState(false);
  const [isAiCaptionsOpen, setIsAiCaptionsOpen] = useState(false);
  const [isAudioSuiteOpen, setIsAudioSuiteOpen] = useState(false);
  const [isMediaAnalyzerOpen, setIsMediaAnalyzerOpen] = useState(false);

  // Apply template from library
  const handleApplyTemplate = (templateId: string) => {
    const tpl = TEMPLATES.find((t) => t.id === templateId);
    if (!tpl) return;

    const newClips: Clip[] = tpl.clips.map((c, idx) => ({
      ...c,
      id: "clip_" + Math.random().toString(36).substring(2, 9),
    }));

    setProject((prev) => ({
      ...prev,
      title: tpl.name,
      aspectRatio: tpl.aspectRatio,
      duration: tpl.duration,
      currentTime: 0,
      isPlaying: false,
      clips: newClips,
      selectedClipId: newClips[0]?.id || null,
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100 font-sans antialiased">
      {/* 1. Header Bar */}
      <Header
        project={project}
        setProject={setProject}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenAiTemplate={() => setIsAiTemplateOpen(true)}
        onOpenAudioSuite={() => setIsAudioSuiteOpen(true)}
        onOpenMediaAnalyzer={() => setIsMediaAnalyzerOpen(true)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onUndo={handleUndo}
        onRedo={handleRedo}
      />

      {/* 2. Middle Work Area */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Sidebar (Asset & AI Library) */}
        <LeftSidebar
          project={project}
          setProject={setProject}
          onOpenAiTemplate={() => setIsAiTemplateOpen(true)}
          onOpenAiCaptions={() => setIsAiCaptionsOpen(true)}
          onOpenAudioSuite={() => setIsAudioSuiteOpen(true)}
          onOpenMediaAnalyzer={() => setIsMediaAnalyzerOpen(true)}
          onApplyTemplate={handleApplyTemplate}
        />

        {/* Center Canvas Video Player */}
        <CanvasPlayer project={project} setProject={setProject} />

        {/* Right Inspector (Selected Clip / Properties) */}
        <RightInspector project={project} setProject={setProject} />
      </div>

      {/* 3. Bottom Multi-Track Timeline */}
      <Timeline project={project} setProject={setProject} />

      {/* 4. Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        project={project}
      />

      <AiTemplateModal
        isOpen={isAiTemplateOpen}
        onClose={() => setIsAiTemplateOpen(false)}
        setProject={setProject}
      />

      <AiCaptionsModal
        isOpen={isAiCaptionsOpen}
        onClose={() => setIsAiCaptionsOpen(false)}
        project={project}
        setProject={setProject}
      />

      <AudioSuiteModal
        isOpen={isAudioSuiteOpen}
        onClose={() => setIsAudioSuiteOpen(false)}
        project={project}
        setProject={setProject}
      />

      <AiMediaAnalyzerModal
        isOpen={isMediaAnalyzerOpen}
        onClose={() => setIsMediaAnalyzerOpen(false)}
        setProject={setProject}
      />
    </div>
  );
}
