import React, { useState } from "react";
import { VideoProject, Clip } from "../types/editor";
import { playSynthSound, autoSyncBeatsToVideo } from "../utils/audioSynth";
import {
  X,
  Volume2,
  Mic,
  Sliders,
  Zap,
  Check,
  Sparkles,
  Waves,
  Play,
  RotateCcw,
} from "lucide-react";

interface AudioSuiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: VideoProject;
  setProject: React.Dispatch<React.SetStateAction<VideoProject>>;
}

export const AudioSuiteModal: React.FC<AudioSuiteModalProps> = ({
  isOpen,
  onClose,
  project,
  setProject,
}) => {
  // Find primary audio clip or video clip
  const primaryAudioClip = project.clips.find((c) => c.trackId === "track_audio") || project.clips[0];

  const [noiseReduction, setNoiseReduction] = useState(primaryAudioClip?.noiseReduction ?? true);
  const [noiseLevel, setNoiseLevel] = useState(primaryAudioClip?.noiseReductionLevel ?? 75);
  const [voiceEnhance, setVoiceEnhance] = useState(primaryAudioClip?.voiceEnhance ?? true);
  const [voicePreset, setVoicePreset] = useState<"studio_mic" | "deep_narrator" | "crisp_podcast" | "radio_warmth">(
    primaryAudioClip?.voiceEnhancePreset ?? "studio_mic"
  );
  const [eqBass, setEqBass] = useState(primaryAudioClip?.eqBass ?? 2);
  const [eqTreble, setEqTreble] = useState(primaryAudioClip?.eqTreble ?? 3);
  const [compressor, setCompressor] = useState(primaryAudioClip?.compressor ?? true);

  const [beatSyncSuccess, setBeatSyncSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Real-time preview of current sound with DSP options
  const handlePreviewAudio = (isCleaned: boolean) => {
    if (isCleaned) {
      playSynthSound("trap_beat", 0.85, {
        noiseReduction,
        noiseReductionLevel: noiseLevel,
        voiceEnhance,
        voiceEnhancePreset: voicePreset,
        eqBass,
        eqTreble,
        compressor,
      });
    } else {
      // Raw unprocessed sound
      playSynthSound("trap_beat", 0.85, {
        noiseReduction: false,
        voiceEnhance: false,
        eqBass: 0,
        eqTreble: 0,
        compressor: false,
      });
    }
  };

  // One-click Auto Sync Beats to Video's Key Moments
  const handleAutoSyncBeats = () => {
    const updated = autoSyncBeatsToVideo(project);
    const videoClipsCount = updated.clips.filter((c) => c.trackId === "track_video").length;
    setProject(updated);
    setBeatSyncSuccess(`Synchronized ${videoClipsCount} scene cuts precisely to musical downbeats!`);
    setTimeout(() => setBeatSyncSuccess(null), 3500);
  };

  // Apply audio suite enhancements to all timeline audio
  const handleApplyAudioSettings = () => {
    setProject((prev) => ({
      ...prev,
      clips: prev.clips.map((c) => {
        if (c.trackId === "track_audio" || c.trackId === "track_video") {
          return {
            ...c,
            noiseReduction,
            noiseReductionLevel: noiseLevel,
            voiceEnhance,
            voiceEnhancePreset: voicePreset,
            eqBass,
            eqTreble,
            compressor,
          };
        }
        return c;
      }),
    }));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-neutral-950 font-bold">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Advanced Audio Studio</h2>
              <p className="text-[11px] text-neutral-400">
                Background noise removal, vocal clarity enhancer, and beat-to-video auto-sync
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
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* SECTION 1: AUTO BEAT SYNC */}
          <div className="p-4 bg-gradient-to-br from-emerald-950/60 via-neutral-950 to-neutral-900 border border-emerald-800/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Auto Beat-to-Video Sync</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800/60 px-2 py-0.5 rounded">
                130 BPM Transient Detection
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              Analyzes all clip transition points and musical downbeats. Automatically adjusts cut lengths so each visual scene transition hits on the exact beat drop.
            </p>

            <button
              onClick={handleAutoSyncBeats}
              className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Auto-Sync Cuts to Music Beats</span>
            </button>

            {beatSyncSuccess && (
              <div className="p-2.5 bg-emerald-900/60 border border-emerald-700/80 rounded-lg text-xs font-semibold text-emerald-200 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{beatSyncSuccess}</span>
              </div>
            )}
          </div>

          {/* SECTION 2: BACKGROUND NOISE REDUCTION */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white">Background Noise Reduction</span>
              </div>
              <button
                onClick={() => setNoiseReduction((v) => !v)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                  noiseReduction
                    ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {noiseReduction ? "Active" : "Bypassed"}
              </button>
            </div>

            <p className="text-[11px] text-neutral-400 leading-relaxed">
              Spectral denoiser with 60Hz AC hum cut and room reverberation attenuation.
            </p>

            {noiseReduction && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300">
                  <span>Reduction Amount</span>
                  <span className="font-mono text-cyan-400">{noiseLevel}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={noiseLevel}
                  onChange={(e) => setNoiseLevel(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* SECTION 3: VOICE ENHANCEMENT & STUDIO MIC */}
          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-white">Voice Enhancement & Studio Clarity</span>
              </div>
              <button
                onClick={() => setVoiceEnhance((v) => !v)}
                className={`text-xs font-bold px-2.5 py-1 rounded-md transition-colors ${
                  voiceEnhance
                    ? "bg-purple-950 text-purple-300 border border-purple-800"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {voiceEnhance ? "Active" : "Bypassed"}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "studio_mic", title: "Studio Broadcast", desc: "Balanced warmth & punch" },
                { id: "deep_narrator", title: "Deep Narrator", desc: "+4dB low-mid resonance" },
                { id: "crisp_podcast", title: "Crisp Podcast", desc: "De-essed high clarity" },
                { id: "radio_warmth", title: "Radio Tube", desc: "Smooth vintage saturation" },
              ].map((p) => (
                <button
                  key={p.id}
                  onClick={() => setVoicePreset(p.id as any)}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    voicePreset === p.id
                      ? "bg-purple-950/70 border-purple-500 text-white"
                      : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200"
                  }`}
                >
                  <div className="text-xs font-bold">{p.title}</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">{p.desc}</div>
                </button>
              ))}
            </div>

            {/* Parametric EQ Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Bass Warmth</span>
                  <span className="font-mono text-neutral-400">{eqBass > 0 ? `+${eqBass}` : eqBass} dB</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="8"
                  value={eqBass}
                  onChange={(e) => setEqBass(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-neutral-300 mb-1">
                  <span>Vocal Presence / Air</span>
                  <span className="font-mono text-neutral-400">{eqTreble > 0 ? `+${eqTreble}` : eqTreble} dB</span>
                </div>
                <input
                  type="range"
                  min="-6"
                  max="8"
                  value={eqTreble}
                  onChange={(e) => setEqTreble(Number(e.target.value))}
                  className="w-full accent-purple-400 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: REAL-TIME A/B TEST PREVIEW */}
          <div className="p-3 bg-neutral-950 rounded-xl border border-neutral-800/80 flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Live Audio A/B Comparison</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePreviewAudio(false)}
                className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3" />
                <span>Hear Raw</span>
              </button>
              <button
                onClick={() => handlePreviewAudio(true)}
                className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Hear Enhanced</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Apply CTA */}
        <div className="px-5 py-3.5 border-t border-neutral-800 bg-neutral-950/60 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApplyAudioSettings}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-neutral-950 text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply to Audio Track</span>
          </button>
        </div>
      </div>
    </div>
  );
};
