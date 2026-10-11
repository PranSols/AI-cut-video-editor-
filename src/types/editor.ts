export type AspectRatio = "9:16" | "16:9" | "1:1" | "4:5" | "21:9";

export type FitMode = "blur_fill" | "smart_reframe" | "fit" | "fill";

export type TrackType = "text" | "sticker" | "overlay" | "video" | "audio";

export type TransitionType = "none" | "crossfade" | "zoom_in" | "glitch" | "whip_pan" | "flash" | "slide_left";

export type FilterType = "none" | "cinematic" | "cyberpunk" | "vhs" | "warm" | "film" | "noir" | "bloom";

export type CaptionStyle = "hormozi" | "neon" | "minimal" | "classic" | "y2k";

export interface Clip {
  id: string;
  trackId: string;
  type: TrackType;
  title: string;
  startTime: number; // in seconds on timeline
  duration: number; // in seconds
  sourceDuration?: number; // total media duration
  offset?: number; // start offset within media
  
  // Visual properties & Fit mode
  mediaUrl?: string;
  thumbnailUrl?: string;
  color?: string; // fallback color or background color
  presetPattern?: "cyber_grid" | "ocean_wave" | "sunset_gradient" | "neon_tunnel" | "fire_sparks" | "starfield" | "solid";
  fitMode?: FitMode;
  
  // Transform
  x?: number; // normalized or px offset
  y?: number;
  scale?: number; // 0.5 to 2.0
  rotation?: number; // in degrees
  opacity?: number; // 0 to 1
  speed?: number; // 0.5x to 3.0x
  
  // Filter & Transition
  filter?: FilterType;
  filterIntensity?: number; // 0 to 1
  transitionIn?: TransitionType;
  transitionDuration?: number;

  // Text specific
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  textColor?: string;
  highlightWord?: string;
  highlightColor?: string;
  captionStyle?: CaptionStyle;
  textAlign?: "center" | "left" | "right";
  
  // Advanced Audio specific
  volume?: number; // 0 to 1
  audioUrl?: string;
  audioCategory?: "bgm" | "sfx" | "voice";
  synthSoundType?: "beat_synth" | "trap_beat" | "lofi_beat" | "whoosh" | "pop" | "ding" | "riser" | "camera";
  waveformPoints?: number[];
  beatMarkers?: number[]; // timestamps for beat drops
  
  // Audio Suite: Noise Reduction & Voice Enhancement
  noiseReduction?: boolean;
  noiseReductionLevel?: number; // 0 to 100%
  voiceEnhance?: boolean;
  voiceEnhancePreset?: "studio_mic" | "deep_narrator" | "crisp_podcast" | "radio_warmth";
  eqBass?: number; // -12 to 12 dB
  eqTreble?: number; // -12 to 12 dB
  compressor?: boolean;
}

export interface Track {
  id: string;
  type: TrackType;
  name: string;
  muted: boolean;
  locked: boolean;
  height?: number;
}

export interface VideoProject {
  id: string;
  title: string;
  aspectRatio: AspectRatio;
  fitMode: FitMode;
  duration: number; // total duration in seconds
  currentTime: number;
  isPlaying: boolean;
  fps: number;
  resolution: "1080p" | "4k" | "720p";
  tracks: Track[];
  clips: Clip[];
  selectedClipId: string | null;
}

export interface TemplatePreset {
  id: string;
  name: string;
  styleCategory: "Viral Hook" | "Cinematic Story" | "E-Commerce" | "Travel Reel" | "Gaming & Tech";
  category: "Trending" | "Viral Hooks" | "Aesthetic" | "Fast Cut" | "Beat Sync";
  description: string;
  aspectRatio: AspectRatio;
  duration: number;
  bpm: number;
  previewGradient: string;
  musicTitle: string;
  tags: string[];
  recommendedMediaType: string;
  clips: Omit<Clip, "id">[];
}

export interface SocialPlatformData {
  tiktok: {
    caption: string;
    hashtags: string[];
    recommendedAudio: string;
    first3SecHookTip: string;
  };
  instagram: {
    caption: string;
    hashtags: string[];
    callToAction: string;
  };
  youtubeShorts: {
    title: string;
    description: string;
    pinnedComment: string;
  };
}
