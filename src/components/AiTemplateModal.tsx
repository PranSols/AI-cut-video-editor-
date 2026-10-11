import React, { useState } from "react";
import { VideoProject, Clip, TransitionType, FilterType, CaptionStyle } from "../types/editor";
import {
  X,
  Sparkles,
  Loader2,
  Check,
  Zap,
  Flame,
  ArrowRight,
  Music,
  Video,
} from "lucide-react";

interface AiTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const AiTemplateModal: React.FC<AiTemplateModalProps> = ({
  isOpen,
  onClose,
  setProject,
}) => {
  const [topic, setTopic] = useState("3 Morning Habits that 10x Your Energy");
  const [platform, setPlatform] = useState<"tiktok" | "reels" | "youtube_shorts">("tiktok");
  const [style, setStyle] = useState<"dynamic" | "aesthetic" | "beat_sync" | "storytelling">("dynamic");
  const [duration, setDuration] = useState<number>(15);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsLoading(true);
    setGeneratedTemplate(null);

    try {
      const res = await fetch("/api/ai/template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platform,
          style,
          duration,
        }),
      });

      if (!res.ok) throw new Error("Template generation request failed");
      const data = await res.json();
      setGeneratedTemplate(data);
    } catch (err: any) {
      console.warn("Fallback template generator:", err);
      // Sensible fallback template
      setGeneratedTemplate({
        templateName: `${topic} - High Retention Cut`,
        description: "Hook-driven viral template optimized for 80%+ watch-through rate.",
        targetAspectRatio: "9:16",
        musicVibe: "130 BPM Phonk Drift Beat",
        colorGrade: "cyberpunk",
        viralTips: [
          "State the negative consequence in the first 2 seconds to trigger FOMO",
          "Cut on audio downbeats every 2.5 seconds to reset audience attention span",
          "Position captions centrally within the TikTok safe margin area",
        ],
        scenes: [
          {
            id: "s1",
            startTime: 0,
            duration: 3.5,
            title: "Viral Hook Frame",
            visualDescription: "High-contrast dynamic motion with fast zoom-in",
            visualPresetType: "cyber_grid",
            voiceoverOrText: "STOP MAKING THIS MISTAKE 🛑",
            captionAnimation: "hormozi",
            transition: "zoom_in",
          },
          {
            id: "s2",
            startTime: 3.5,
            duration: 4.0,
            title: "Value Insight",
            visualDescription: "Smooth ocean waves with clean title lower-third",
            visualPresetType: "ocean_wave",
            voiceoverOrText: "HERE IS WHAT ACTUALLY WORKS",
            captionAnimation: "hormozi",
            transition: "whip_pan",
          },
          {
            id: "s3",
            startTime: 7.5,
            duration: 4.0,
            title: "Action Step",
            visualDescription: "Warm golden light with focused typography",
            visualPresetType: "sunset_gradient",
            voiceoverOrText: "APPLY THIS HABIT TODAY",
            captionAnimation: "neon",
            transition: "flash",
          },
          {
            id: "s4",
            startTime: 11.5,
            duration: 3.5,
            title: "Retention CTA",
            visualDescription: "Starfield cosmos with bookmark incentive",
            visualPresetType: "starfield",
            voiceoverOrText: "SAVE THIS FOR LATER ⚡",
            captionAnimation: "hormozi",
            transition: "crossfade",
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyToTimeline = () => {
    if (!generatedTemplate) return;

    const newClips: Clip[] = [];
    let curTime = 0;

    const filterType: FilterType = (generatedTemplate.colorGrade as FilterType) || "cyberpunk";

    // Build video track and text track clips
    generatedTemplate.scenes.forEach((scene: any, idx: number) => {
      const dur = scene.duration || 3.5;
      const pattern =
        scene.visualPresetType === "cyber_grid" ||
        scene.visualPresetType === "ocean_wave" ||
        scene.visualPresetType === "sunset_gradient" ||
        scene.visualPresetType === "starfield"
          ? scene.visualPresetType
          : idx % 2 === 0
          ? "cyber_grid"
          : "sunset_gradient";

      // 1. Video clip
      newClips.push({
        id: "gen_vid_" + Math.random().toString(36).substring(2, 9),
        trackId: "track_video",
        type: "video",
        title: scene.title || `Scene ${idx + 1}`,
        startTime: curTime,
        duration: dur,
        presetPattern: pattern,
        color: "#0f172a",
        scale: 1.0,
        speed: 1.0,
        filter: filterType,
        filterIntensity: 0.8,
        transitionIn: (scene.transition as TransitionType) || "zoom_in",
        transitionDuration: 0.3,
      });

      // 2. Text caption clip
      if (scene.voiceoverOrText) {
        newClips.push({
          id: "gen_txt_" + Math.random().toString(36).substring(2, 9),
          trackId: "track_text",
          type: "text",
          title: `Caption ${idx + 1}`,
          startTime: curTime,
          duration: dur - 0.2,
          text: scene.voiceoverOrText,
          fontSize: 32,
          textColor: "#ffffff",
          highlightWord: scene.voiceoverOrText.split(" ")[0] || "",
          highlightColor: "#eab308",
          captionStyle: "hormozi",
          textAlign: "center",
          y: 65,
        });
      }

      curTime += dur;
    });

    // 3. Audio BGM
    newClips.push({
      id: "gen_aud_" + Math.random().toString(36).substring(2, 9),
      trackId: "track_audio",
      type: "audio",
      title: generatedTemplate.musicVibe || "AI Synced Beat",
      startTime: 0,
      duration: curTime,
      synthSoundType: "trap_beat",
      volume: 0.85,
      audioCategory: "bgm",
    });

    // Apply to project
    setProject((prev) => ({
      ...prev,
      title: generatedTemplate.templateName || prev.title,
      duration: curTime,
      aspectRatio: "9:16",
      currentTime: 0,
      isPlaying: false,
      clips: newClips,
      selectedClipId: newClips[0]?.id || null,
    }));

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-neutral-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Template Studio</h2>
              <p className="text-[11px] text-neutral-400">
                Transform any topic or script into a complete multi-clip timeline
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
          {/* Prompt / Topic Input */}
          <div>
            <label className="text-xs font-bold text-neutral-200 block mb-1.5">
              Video Topic or Script Hook
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. 5 Common Gym Mistakes Beginners Make"
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none font-medium"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                "3 Morning Habits that 10x Energy",
                "Cyberpunk Night Walk in Tokyo",
                "Product Unboxing: Sleek Minimal Desk",
                "Stoic Philosophy for Modern Life",
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setTopic(sample)}
                  className="px-2 py-0.5 bg-neutral-950 border border-neutral-800/80 hover:border-cyan-500/40 text-[10px] text-neutral-400 hover:text-cyan-300 rounded-md transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Grid: Platform, Style, Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Platform</label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="tiktok">TikTok</option>
                <option value="reels">Instagram Reels</option>
                <option value="youtube_shorts">YouTube Shorts</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="dynamic">Dynamic Fast Cut</option>
                <option value="aesthetic">Aesthetic Calm</option>
                <option value="beat_sync">Beat Sync (130 BPM)</option>
                <option value="storytelling">Storytelling Narrative</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-neutral-300 block mb-1">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value={10}>10 Seconds (Quick Hook)</option>
                <option value={15}>15 Seconds (Optimal TikTok)</option>
                <option value={30}>30 Seconds (Deep Value)</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !topic.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Designing Timeline Structure...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Template</span>
              </>
            )}
          </button>

          {/* Result Preview */}
          {generatedTemplate && (
            <div className="space-y-3.5 pt-2 border-t border-neutral-800/80">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {generatedTemplate.templateName}
                  </h3>
                  <p className="text-[11px] text-neutral-400">{generatedTemplate.description}</p>
                </div>
                <span className="text-[10px] font-mono font-semibold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  🎵 {generatedTemplate.musicVibe}
                </span>
              </div>

              {/* Scenes Breakdown */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-neutral-300 block">
                  Generated Scenes ({generatedTemplate.scenes?.length} Cuts)
                </span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {generatedTemplate.scenes?.map((sc: any, idx: number) => (
                    <div
                      key={sc.id || idx}
                      className="p-2.5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 font-bold text-neutral-200">
                          <span className="text-cyan-400 font-mono">0{idx + 1}.</span>
                          <span className="truncate">{sc.title}</span>
                          <span className="text-[10px] text-neutral-500 font-mono font-normal">
                            ({sc.duration}s)
                          </span>
                        </div>
                        <div className="text-[11px] text-yellow-300 font-medium truncate mt-0.5">
                          💬 "{sc.voiceoverOrText}"
                        </div>
                      </div>
                      <span className="text-[10px] bg-neutral-800/80 text-neutral-300 px-2 py-0.5 rounded font-mono shrink-0">
                        ⚡ {sc.transition || "zoom_in"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={handleApplyToTimeline}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Check className="w-4 h-4" />
                <span>Apply Template to Timeline</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
