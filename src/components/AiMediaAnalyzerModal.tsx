import React, { useState } from "react";
import { VideoProject, Clip, TemplatePreset } from "../types/editor";
import { TEMPLATES } from "../utils/stockMedia";
import {
  X,
  Sparkles,
  Upload,
  Film,
  Check,
  Loader2,
  ArrowRight,
  TrendingUp,
  Tag,
  Radio,
} from "lucide-react";

interface AiMediaAnalyzerModalProps {
  isOpen: boolean;
  onClose: () => void;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const AiMediaAnalyzerModal: React.FC<AiMediaAnalyzerModalProps> = ({
  isOpen,
  onClose,
  setProject,
}) => {
  const [selectedMediaDescription, setSelectedMediaDescription] = useState(
    "Short clips of an aesthetic coffee shop, slow walk through sunlit street, and laptop workspace."
  );
  const [uploadedFilesCount, setUploadedFilesCount] = useState<number>(4);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedTemplate, setSuggestedTemplate] = useState<TemplatePreset | null>(null);
  const [analysisInsights, setAnalysisInsights] = useState<{
    detectedVibe: string;
    optimalPlatform: string;
    colorPalette: string;
    musicSuggestion: string;
    reasoning: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleAnalyzeMedia = async () => {
    setAnalyzing(true);
    setSuggestedTemplate(null);
    setAnalysisInsights(null);

    try {
      const res = await fetch("/api/ai/analyze-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaDescription: selectedMediaDescription,
          filesCount: uploadedFilesCount,
        }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      
      const matched = TEMPLATES.find((t) => t.id === data.recommendedTemplateId) || TEMPLATES[1];
      setSuggestedTemplate(matched);
      setAnalysisInsights({
        detectedVibe: data.detectedVibe || "Aesthetic & Cinematic Lifestyle",
        optimalPlatform: data.optimalPlatform || "Instagram Reels / YouTube Shorts",
        colorPalette: data.colorPalette || "Warm Golden & Amber Tones",
        musicSuggestion: data.musicSuggestion || matched.musicTitle,
        reasoning: data.reasoning || "The pacing of sunlight lifestyle imagery pairs best with 85-115 BPM cinematic flow.",
      });
    } catch (e) {
      // Fallback matching
      const descLower = selectedMediaDescription.toLowerCase();
      let matched = TEMPLATES[1]; // default cinematic
      if (descLower.includes("product") || descLower.includes("unboxing") || descLower.includes("store")) {
        matched = TEMPLATES[2]; // E-Commerce
      } else if (descLower.includes("travel") || descLower.includes("beach") || descLower.includes("vacation")) {
        matched = TEMPLATES[3]; // Travel
      } else if (descLower.includes("game") || descLower.includes("tech") || descLower.includes("gpu")) {
        matched = TEMPLATES[4]; // Gaming
      } else if (descLower.includes("viral") || descLower.includes("tiktok") || descLower.includes("hook")) {
        matched = TEMPLATES[0]; // Fast Cut
      }

      setSuggestedTemplate(matched);
      setAnalysisInsights({
        detectedVibe: `${matched.styleCategory} Atmosphere`,
        optimalPlatform: `${matched.aspectRatio} Social Feed`,
        colorPalette: "Harmonized Gradient Grading",
        musicSuggestion: matched.musicTitle,
        reasoning: `Matched based on visual pacing and content theme for high retention on social feeds.`,
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplySuggestedTemplate = () => {
    if (!suggestedTemplate) return;

    const newClips: Clip[] = suggestedTemplate.clips.map((c) => ({
      ...c,
      id: "clip_" + Math.random().toString(36).substring(2, 9),
    }));

    setProject((prev) => ({
      ...prev,
      title: suggestedTemplate.name,
      aspectRatio: suggestedTemplate.aspectRatio,
      duration: suggestedTemplate.duration,
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center text-neutral-950 font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">AI Media & Template Matcher</h2>
              <p className="text-[11px] text-neutral-400">
                Analyze your raw clips or photos to automatically suggest the ideal template style
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
          {/* Quick preset input media scenarios */}
          <div>
            <label className="text-xs font-bold text-neutral-300 block mb-1.5">
              Describe or Select Your Input Media
            </label>
            <textarea
              value={selectedMediaDescription}
              onChange={(e) => setSelectedMediaDescription(e.target.value)}
              rows={3}
              placeholder="e.g. 5 photos of our new product and 1 short unboxing clip on a table..."
              className="w-full bg-neutral-950 border border-neutral-800 focus:border-cyan-500 rounded-xl p-3 text-xs text-white focus:outline-none font-medium leading-relaxed resize-none"
            />

            <div className="flex flex-wrap gap-1.5 mt-2">
              {[
                "Product showcase photos & packaging unboxing",
                "Beach sunset video and cliffside hiking clips",
                "Quick talking-head video with punchy tips",
                "High-FPS PC gameplay highlights and reaction",
              ].map((sample) => (
                <button
                  key={sample}
                  onClick={() => setSelectedMediaDescription(sample)}
                  className="px-2 py-0.5 bg-neutral-950 border border-neutral-800/80 hover:border-cyan-500/40 text-[10px] text-neutral-400 hover:text-cyan-300 rounded-md transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>
          </div>

          {/* Action Analyze */}
          <button
            onClick={handleAnalyzeMedia}
            disabled={analyzing || !selectedMediaDescription.trim()}
            className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-400 hover:to-indigo-400 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            {analyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing Visual Vibe & Audio Tempo...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Media & Recommend Template</span>
              </>
            )}
          </button>

          {/* Analysis & Recommendation Result */}
          {suggestedTemplate && analysisInsights && (
            <div className="space-y-4 pt-3 border-t border-neutral-800/80">
              {/* Insight pills */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Detected Vibe</span>
                  <div className="font-bold text-white truncate">{analysisInsights.detectedVibe}</div>
                </div>
                <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1">
                  <span className="text-[10px] font-mono text-neutral-400 uppercase">Best Platform</span>
                  <div className="font-bold text-cyan-300 truncate">{analysisInsights.optimalPlatform}</div>
                </div>
              </div>

              {/* Recommended Template Card */}
              <div className="p-4 bg-gradient-to-br from-neutral-950 to-neutral-900 border border-cyan-800/60 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                    ★ Best Matched Template
                  </span>
                  <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded">
                    {suggestedTemplate.bpm} BPM · {suggestedTemplate.aspectRatio}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white">{suggestedTemplate.name}</h3>
                  <p className="text-xs text-neutral-300 leading-relaxed mt-1">
                    {suggestedTemplate.description}
                  </p>
                </div>

                <div className="text-[11px] text-neutral-400 flex items-center gap-2">
                  <span>🎵 Music:</span>
                  <span className="text-neutral-200 font-semibold">{suggestedTemplate.musicTitle}</span>
                </div>

                <button
                  onClick={handleApplySuggestedTemplate}
                  className="w-full py-2 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-neutral-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply Recommended Template to Timeline</span>
                </button>
              </div>
            </div>
          )}

          {/* 5 Distinct Styles Reference List */}
          <div>
            <div className="text-xs font-bold text-neutral-300 mb-2">Available 5 Template Styles</div>
            <div className="space-y-1.5">
              {TEMPLATES.map((tpl) => (
                <div
                  key={tpl.id}
                  onClick={() => setSuggestedTemplate(tpl)}
                  className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    suggestedTemplate?.id === tpl.id
                      ? "bg-cyan-950/60 border-cyan-500 text-white"
                      : "bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700"
                  }`}
                >
                  <div>
                    <div className="font-bold text-white">{tpl.name}</div>
                    <div className="text-[10px] text-neutral-400 truncate max-w-sm">
                      {tpl.styleCategory} · {tpl.aspectRatio} · {tpl.bpm} BPM
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400">Select</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
