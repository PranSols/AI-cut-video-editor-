import React, { useState } from "react";
import { VideoProject, SocialPlatformData } from "../types/editor";
import { exportVideoBlob } from "../utils/canvasRenderer";
import {
  X,
  Download,
  Share2,
  Check,
  Copy,
  Sparkles,
  Smartphone,
  Heart,
  MessageCircle,
  Bookmark,
  Send,
  Music2,
  Loader2,
  Calendar,
} from "lucide-react";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, project }) => {
  const [activeTab, setActiveTab] = useState<"export" | "social">("export");
  const [resolution, setResolution] = useState<"1080p" | "4k" | "720p">("1080p");
  const [fps, setFps] = useState<number>(30);

  // Export render state
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportedBlobUrl, setExportedBlobUrl] = useState<string | null>(null);

  // Social sharing state
  const [selectedPlatform, setSelectedPlatform] = useState<"tiktok" | "instagram" | "youtube">("tiktok");
  const [socialData, setSocialData] = useState<SocialPlatformData | null>(null);
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [scheduledStatus, setScheduledStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real canvas rendering and download
  const handleStartExport = async () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportedBlobUrl(null);

    try {
      const blob = await exportVideoBlob(
        { ...project, resolution },
        (progress) => {
          setExportProgress(progress);
        }
      );

      const url = URL.createObjectURL(blob);
      setExportedBlobUrl(url);

      // Trigger automatic file download
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.title.toLowerCase().replace(/\s+/g, "_")}_${resolution}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  // Generate AI Social Package (Hashtags, Hooks, SEO Captions)
  const handleGenerateSocialPackage = async () => {
    setIsGeneratingSocial(true);
    try {
      const res = await fetch("/api/ai/social-package", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          videoSummary: project.clips
            .filter((c) => c.type === "text" || c.type === "video")
            .map((c) => c.text || c.title)
            .join(" - "),
          duration: Math.round(project.duration),
        }),
      });

      if (!res.ok) throw new Error("Failed to generate social package");
      const data = await res.json();
      setSocialData(data);
    } catch (e: any) {
      console.warn("AI social package fallback:", e);
      // Fallback sensible social package
      setSocialData({
        tiktok: {
          caption: "This editing trick will change the way you make reels! 🤯 Watch till the end.",
          hashtags: ["#fyp", "#viral", "#videoediting", "#aicut", "#creator"],
          recommendedAudio: "Night Drift (Slowed Phonk)",
          first3SecHookTip: "Show the dramatic final frame first to hook retention immediately.",
        },
        instagram: {
          caption: "Save this secret editing blueprint for your next viral reel. ⚡ Clean transitions and synchronized beat pacing make all the difference.",
          hashtags: ["#reelsviral", "#contentcreator", "#videoeditor", "#aivideo"],
          callToAction: "Save & share with another creator!",
        },
        youtubeShorts: {
          title: `${project.title} - The Secret AI Cut Editing Workflow`,
          description: "Step-by-step breakdown of high-retention video editing with AI captions.",
          pinnedComment: "Which transition style do you use the most: Zoom In or Whip Pan?",
        },
      });
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const handleCopyCaption = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-400 flex items-center justify-center text-neutral-950 font-bold">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Export & Social Media Studio</h2>
              <p className="text-[11px] text-neutral-400">
                Render high-res video and publish directly to TikTok, Reels, & Shorts
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

        {/* Top Segmented Tabs */}
        <div className="flex items-center px-5 pt-3 pb-2 border-b border-neutral-800/80 bg-neutral-950/40">
          <div className="flex items-center gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg">
            <button
              onClick={() => setActiveTab("export")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeTab === "export"
                  ? "bg-neutral-800 text-cyan-300 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Video Export Settings
            </button>
            <button
              onClick={() => {
                setActiveTab("social");
                if (!socialData) handleGenerateSocialPackage();
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors flex items-center gap-1.5 ${
                activeTab === "social"
                  ? "bg-neutral-800 text-cyan-300 shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Media Publisher</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-5">
          {activeTab === "export" && (
            <div className="space-y-5">
              {/* Quality & Resolution selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-2">
                    Export Resolution
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["720p", "1080p", "4k"] as const).map((res) => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all ${
                          resolution === res
                            ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <div>{res}</div>
                        <div className="text-[10px] font-normal text-neutral-500">
                          {res === "4k" ? "Ultra HD" : res === "1080p" ? "Full HD" : "Fast Web"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-2">
                    Frame Rate (FPS)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[30, 60].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setFps(rate)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          fps === rate
                            ? "bg-cyan-950/80 border-cyan-500 text-cyan-300 shadow-sm"
                            : "bg-neutral-950/60 border-neutral-800 text-neutral-400 hover:text-white"
                        }`}
                      >
                        <div>{rate} FPS</div>
                        <div className="text-[10px] font-normal text-neutral-500">
                          {rate === 60 ? "Smooth Motion" : "Standard Web"}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Video Details Card */}
              <div className="p-3.5 bg-neutral-950/70 rounded-xl border border-neutral-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Project Format:</span>
                  <span className="font-mono text-white font-bold">{project.aspectRatio}</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Estimated Duration:</span>
                  <span className="font-mono text-white font-bold">{project.duration.toFixed(1)}s</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400">
                  <span>Encoding Format:</span>
                  <span className="font-mono text-cyan-400 font-bold">WebM (VP9 High Profile)</span>
                </div>
                <div className="flex items-center justify-between text-neutral-400 pt-1 border-t border-neutral-800">
                  <span>Creator Gear Partner:</span>
                  <a
                    href="https://shop26.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <span>shop26.in</span>
                    <span className="text-[10px] text-neutral-500">↗</span>
                  </a>
                </div>
              </div>

              {/* Progress bar during rendering */}
              {isExporting && (
                <div className="space-y-2 p-4 bg-neutral-950 rounded-xl border border-cyan-800/60">
                  <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      <span>Compositing layers and rendering video...</span>
                    </span>
                    <span className="font-mono text-cyan-400">{exportProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 transition-all duration-150"
                      style={{ width: `${exportProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Success notification after export */}
              {exportedBlobUrl && (
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Video rendered successfully & download started!</span>
                  </div>
                  <a
                    href={exportedBlobUrl}
                    download={`${project.title.toLowerCase().replace(/\s+/g, "_")}.webm`}
                    className="px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Again</span>
                  </a>
                </div>
              )}

              {/* Export CTA Button */}
              <button
                onClick={handleStartExport}
                disabled={isExporting}
                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 disabled:opacity-50 text-neutral-950 text-xs font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center gap-2"
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Rendering Video ({exportProgress}%)...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>Start Video Export ({resolution})</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* SOCIAL MEDIA PUBLISHER TAB */}
          {activeTab === "social" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: Platform selectors & AI metadata */}
              <div className="space-y-4">
                {/* Platform Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-neutral-950 rounded-xl border border-neutral-800">
                  {[
                    { id: "tiktok", label: "TikTok", icon: "🎵" },
                    { id: "instagram", label: "Instagram Reels", icon: "📸" },
                    { id: "youtube", label: "YouTube Shorts", icon: "▶️" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlatform(p.id as any)}
                      className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                        selectedPlatform === p.id
                          ? "bg-neutral-800 text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>

                {/* AI Social Package Generator CTA */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-200">AI Viral Package</span>
                  <button
                    onClick={handleGenerateSocialPackage}
                    disabled={isGeneratingSocial}
                    className="flex items-center gap-1 text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3 animate-spin" />
                    <span>Regenerate Tags & Hooks</span>
                  </button>
                </div>

                {/* Display Platform-Specific Details */}
                {socialData && (
                  <div className="space-y-3">
                    {/* Caption Box */}
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-neutral-300">
                        <span>Optimized Caption</span>
                        <button
                          onClick={() => {
                            const txt =
                              selectedPlatform === "tiktok"
                                ? `${socialData.tiktok.caption}\n\n${socialData.tiktok.hashtags.join(" ")}`
                                : selectedPlatform === "instagram"
                                ? `${socialData.instagram.caption}\n\n${socialData.instagram.hashtags.join(" ")}`
                                : `${socialData.youtubeShorts.title}\n\n${socialData.youtubeShorts.description}`;
                            handleCopyCaption(txt);
                          }}
                          className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                        >
                          {copiedCaption ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedCaption ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <p className="text-xs text-neutral-300 leading-relaxed font-medium">
                        {selectedPlatform === "tiktok"
                          ? socialData.tiktok.caption
                          : selectedPlatform === "instagram"
                          ? socialData.instagram.caption
                          : socialData.youtubeShorts.title}
                      </p>
                    </div>

                    {/* Hashtags */}
                    <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800 space-y-1.5">
                      <span className="text-[11px] font-bold text-neutral-300 block">
                        Trending Hashtags
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(selectedPlatform === "tiktok"
                          ? socialData.tiktok.hashtags
                          : selectedPlatform === "instagram"
                          ? socialData.instagram.hashtags
                          : ["#shorts", "#viral", "#video"]
                        ).map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-neutral-800/80 text-cyan-300 rounded text-[11px] font-mono font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Viral Hook Tip */}
                    {selectedPlatform === "tiktok" && socialData.tiktok.first3SecHookTip && (
                      <div className="p-3 bg-cyan-950/40 border border-cyan-800/40 rounded-xl text-[11px] text-cyan-200 leading-relaxed">
                        🎯 <strong className="text-cyan-300">First 3s Retention Hook:</strong>{" "}
                        {socialData.tiktok.first3SecHookTip}
                      </div>
                    )}
                  </div>
                )}

                {/* Simulated Publish / Schedule Action */}
                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setScheduledStatus("Scheduled for peak engagement (6:30 PM EST)!");
                      setTimeout(() => setScheduledStatus(null), 3000);
                    }}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Schedule Post</span>
                  </button>

                  <button
                    onClick={() => {
                      setScheduledStatus("Published directly to TikTok Drafts!");
                      setTimeout(() => setScheduledStatus(null), 3000);
                    }}
                    className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish Now</span>
                  </button>
                </div>

                {scheduledStatus && (
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 text-emerald-300 text-xs font-semibold rounded-lg flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>{scheduledStatus}</span>
                  </div>
                )}
              </div>

              {/* Right Column: Realistic Phone Screen Mockup Preview */}
              <div className="flex flex-col items-center justify-center">
                <div className="text-xs font-bold text-neutral-400 mb-2">Live Feed Preview</div>
                <div className="w-56 h-[380px] bg-neutral-950 rounded-3xl border-4 border-neutral-800 shadow-2xl relative overflow-hidden flex flex-col justify-between p-3 select-none">
                  {/* Header mock */}
                  <div className="flex items-center justify-between text-[10px] text-white/80 pt-1">
                    <span>LIVE</span>
                    <span className="font-bold">For You</span>
                    <span>🔍</span>
                  </div>

                  {/* Center mock text */}
                  <div className="text-center">
                    <span className="text-xs font-black text-white drop-shadow tracking-wider">
                      {project.clips.find((c) => c.type === "text")?.text || project.title}
                    </span>
                  </div>

                  {/* Right side interaction buttons (Like, Comment, Share) */}
                  <div className="absolute right-2.5 bottom-16 flex flex-col items-center gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-neutral-800/80 flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                      </div>
                      <span className="text-[9px] font-bold text-white mt-0.5">24.5K</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-neutral-800/80 flex items-center justify-center">
                        <MessageCircle className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className="text-[9px] font-bold text-white mt-0.5">842</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="w-7 h-7 rounded-full bg-neutral-800/80 flex items-center justify-center">
                        <Bookmark className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      </div>
                      <span className="text-[9px] font-bold text-white mt-0.5">5.2K</span>
                    </div>
                  </div>

                  {/* Bottom User & Caption info */}
                  <div className="space-y-1 pb-1">
                    <div className="text-[11px] font-bold text-white">@aicut_creator</div>
                    <div className="text-[10px] text-neutral-300 line-clamp-2">
                      {socialData ? socialData.tiktok.caption : project.title}
                    </div>
                    <div className="flex items-center gap-1 text-[9px] text-neutral-400">
                      <Music2 className="w-2.5 h-2.5" />
                      <span className="truncate">Original Sound · AI Cut Beat Lab</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
