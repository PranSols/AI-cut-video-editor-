import React, { useState } from "react";
import { VideoProject, Clip, CaptionStyle } from "../types/editor";
import {
  X,
  Type,
  Sparkles,
  Loader2,
  Check,
  Zap,
} from "lucide-react";

interface AiCaptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const AiCaptionsModal: React.FC<AiCaptionsModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
}) => {
  const [transcript, setTranscript] = useState(
    "Stop scrolling right now. This is the single biggest CapCut editing secret you need to know."
  );
  const [style, setStyle] = useState<CaptionStyle>("hormozi");
  const [highlightColor, setHighlightColor] = useState("#facc15");
  const [isLoading, setIsLoading] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<any[] | null>(null);

  if (!isOpen) return null;

  const handleGenerateCaptions = async () => {
    setIsLoading(true);
    setGeneratedCaptions(null);

    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: transcript,
          totalDuration: project.duration || 12,
          style,
        }),
      });

      if (!res.ok) throw new Error("Captions generation failed");
      const data = await res.json();
      setGeneratedCaptions(data.captions || []);
    } catch (err: any) {
      console.warn("Auto captions fallback:", err);
      // Sensible fallback segments based on transcript
      const words = transcript.split(" ");
      const chunkSize = 3;
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push(words.slice(i, i + chunkSize).join(" "));
      }

      const totalDur = project.duration || 12;
      const segDur = totalDur / Math.max(1, chunks.length);

      const fallback = chunks.map((chunk, idx) => ({
        id: `c_${idx}`,
        startTime: idx * segDur,
        endTime: (idx + 1) * segDur,
        text: chunk,
        highlightWord: chunk.split(" ")[0] || "",
        emphasisColor: highlightColor,
      }));

      setGeneratedCaptions(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyCaptions = () => {
    if (!generatedCaptions || generatedCaptions.length === 0) return;

    const newClips: Clip[] = generatedCaptions.map((cap) => ({
      id: "cap_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_text",
      type: "text",
      title: cap.text.substring(0, 16),
      startTime: cap.startTime,
      duration: Math.max(1.0, cap.endTime - cap.startTime),
      text: cap.text,
      fontSize: 32,
      textColor: "#ffffff",
      highlightWord: cap.highlightWord || cap.text.split(" ")[0],
      highlightColor: cap.emphasisColor || highlightColor,
      captionStyle: style,
      textAlign: "center",
      y: 68,
    }));

    setProject((prev) => ({
      ...prev,
      clips: [...prev.clips.filter((c) => c.trackId !== "track_text"), ...newClips],
      selectedClipId: newClips[0]?.id || null,
    }));

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Auto-Captions Studio</h2>
              <p className="text-[11px] text-neutral-400">
                Word-by-word timed karaoke animations with viral highlight words
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-1.5">
              Spoken Script or Voiceover Narration
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              rows={3}
              placeholder="Enter spoken narration or script to auto-sync..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-purple-500 rounded-xl p-3 text-xs text-white focus:outline-none font-medium leading-relaxed resize-none"
            />
          </div>

          {/* Style Selector */}
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-2">
              Caption Visual Style
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "hormozi", name: "Hormozi Viral", desc: "Bold uppercase + highlight word" },
                { id: "neon", name: "Cyber Neon", desc: "Glow shadow on key words" },
                { id: "minimal", name: "Clean Minimal", desc: "Subtle aesthetic lower-third" },
                { id: "classic", name: "Classic Pop", desc: "Crisp white with black stroke" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setStyle(item.id as CaptionStyle)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    style === item.id
                      ? "bg-purple-950/70 border-purple-500 text-white"
                      : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <div className="text-xs font-bold">{item.name}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Highlight Color */}
          <div className="flex items-center justify-between p-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <span className="text-xs font-bold text-neutral-300">Highlight Emphasis Color:</span>
            <div className="flex items-center gap-2">
              {["#facc15", "#22c55e", "#06b6d4", "#ec4899", "#f97316"].map((color) => (
                <button
                  key={color}
                  onClick={() => setHighlightColor(color)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    highlightColor === color ? "scale-125 ring-2 ring-white" : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerateCaptions}
            disabled={isLoading || !transcript.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Syncing Timestamps with Audio Pacing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Generate Synced Captions</span>
              </>
            )}
          </button>

          {/* Generated Captions Preview */}
          {generatedCaptions && (
            <div className="space-y-3 pt-2 border-t border-neutral-800">
              <span className="text-xs font-bold text-neutral-300 block">
                Timed Subtitle Segments ({generatedCaptions.length})
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {generatedCaptions.map((c, idx) => (
                  <div
                    key={c.id || idx}
                    className="p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-mono text-[10px] text-purple-400 shrink-0">
                        {c.startTime.toFixed(1)}s - {c.endTime.toFixed(1)}s
                      </span>
                      <span className="text-neutral-200 font-semibold truncate">
                        "{c.text}"
                      </span>
                    </div>
                    {c.highlightWord && (
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{
                          backgroundColor: `${c.emphasisColor || highlightColor}25`,
                          color: c.emphasisColor || highlightColor,
                        }}
                      >
                        ★ {c.highlightWord}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleApplyCaptions}
                className="w-full py-2.5 bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md"
              >
                <Check className="w-4 h-4" />
                <span>Add Captions to Timeline Track</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
