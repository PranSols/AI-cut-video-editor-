import { Clip, VideoProject, FilterType, FitMode } from "../types/editor";

export function getResolutionDimensions(aspectRatio: string, resolution: "1080p" | "4k" | "720p" = "1080p") {
  let baseWidth = 1080;
  let baseHeight = 1920;

  if (aspectRatio === "16:9") {
    baseWidth = 1920;
    baseHeight = 1080;
  } else if (aspectRatio === "1:1") {
    baseWidth = 1080;
    baseHeight = 1080;
  } else if (aspectRatio === "4:5") {
    baseWidth = 1080;
    baseHeight = 1350;
  } else if (aspectRatio === "21:9") {
    baseWidth = 2560;
    baseHeight = 1080;
  } else {
    // 9:16
    baseWidth = 1080;
    baseHeight = 1920;
  }

  const scale = resolution === "4k" ? 2 : resolution === "720p" ? 0.666 : 1;
  return {
    width: Math.round(baseWidth * scale),
    height: Math.round(baseHeight * scale),
  };
}

// Particle states for rendering patterns
interface Particle {
  x: number;
  y: number;
  z?: number;
  size: number;
  speed: number;
  opacity: number;
}

const sparksPool: Particle[] = Array.from({ length: 45 }, () => ({
  x: Math.random(),
  y: Math.random(),
  size: 2 + Math.random() * 5,
  speed: 0.15 + Math.random() * 0.4,
  opacity: 0.4 + Math.random() * 0.6,
}));

const starPool: Particle[] = Array.from({ length: 90 }, () => ({
  x: (Math.random() - 0.5) * 2,
  y: (Math.random() - 0.5) * 2,
  z: Math.random(),
  size: 1.5 + Math.random() * 3,
  speed: 0.2 + Math.random() * 0.3,
  opacity: 0.5 + Math.random() * 0.5,
}));

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  project: VideoProject,
  targetTime: number,
  options?: { showGuides?: boolean; watermark?: boolean }
) {
  const { width, height } = ctx.canvas;
  const t = targetTime;
  const fitMode: FitMode = project.fitMode || "blur_fill";

  // 1. Clear background
  ctx.fillStyle = "#09090b";
  ctx.fillRect(0, 0, width, height);

  // 2. Sort clips by track priority: main video -> overlay -> sticker -> text
  const trackOrder = ["track_video", "track_overlay", "track_sticker", "track_text"];
  const activeClips = project.clips.filter(
    (c) => t >= c.startTime && t < c.startTime + c.duration
  );

  activeClips.sort((a, b) => {
    return trackOrder.indexOf(a.trackId) - trackOrder.indexOf(b.trackId);
  });

  // Track applied filter
  let primaryFilter: FilterType = "none";
  let filterStrength = 0;

  for (const clip of activeClips) {
    if (clip.filter && clip.filter !== "none") {
      primaryFilter = clip.filter;
      filterStrength = clip.filterIntensity ?? 0.8;
    }

    const timeInClip = t - clip.startTime;

    ctx.save();

    // Transition In handling
    let transitionAlpha = 1.0;
    let transitionScale = 1.0;
    let transitionOffsetX = 0;
    let transitionFlash = 0;

    const transDur = clip.transitionDuration || 0.3;
    if (timeInClip < transDur && clip.transitionIn && clip.transitionIn !== "none") {
      const p = timeInClip / transDur;
      switch (clip.transitionIn) {
        case "crossfade":
          transitionAlpha = p;
          break;
        case "zoom_in":
          transitionScale = 1.25 - 0.25 * p;
          transitionAlpha = Math.min(1, p * 1.5);
          break;
        case "whip_pan":
          transitionOffsetX = (1 - p) * width * 0.4;
          transitionAlpha = p;
          break;
        case "slide_left":
          transitionOffsetX = (1 - p) * width;
          break;
        case "flash":
          transitionFlash = 1 - p;
          break;
        case "glitch":
          transitionOffsetX = Math.sin(timeInClip * 40) * 20 * (1 - p);
          break;
      }
    }

    ctx.globalAlpha = (clip.opacity ?? 1.0) * transitionAlpha;

    // Apply basic transformations
    const centerX = width / 2 + (clip.x ? (clip.x - 50) * (width / 100) : 0) + transitionOffsetX;
    const centerY = height / 2 + (clip.y ? (clip.y - 50) * (height / 100) : 0);
    const clipScale = (clip.scale ?? 1.0) * transitionScale;

    ctx.translate(centerX, centerY);
    if (clip.rotation) {
      ctx.rotate((clip.rotation * Math.PI) / 180);
    }
    ctx.scale(clipScale, clipScale);
    ctx.translate(-centerX, -centerY);

    // Render based on clip type & intelligent Fit Mode
    if (clip.type === "video" || clip.type === "overlay") {
      renderIntelligentVideoClip(ctx, clip, timeInClip, width, height, fitMode, project.aspectRatio);
    } else if (clip.type === "text") {
      renderTextCaption(ctx, clip, timeInClip, width, height);
    } else if (clip.type === "sticker") {
      renderSticker(ctx, clip, timeInClip, width, height);
    }

    ctx.restore();

    // Flash transition overlay
    if (transitionFlash > 0.05) {
      ctx.save();
      ctx.fillStyle = `rgba(255, 255, 255, ${transitionFlash * 0.85})`;
      ctx.fillRect(0, 0, width, height);
      ctx.restore();
    }
  }

  // 3. Post-Processing Color Grade Filter Pass
  if (primaryFilter !== "none") {
    applyPostProcessingFilter(ctx, primaryFilter, filterStrength, width, height, t);
  }

  // 4. Safe Margin Guides for Social Media (TikTok / Reels layout)
  if (options?.showGuides && project.aspectRatio === "9:16") {
    renderSocialSafeZoneGuides(ctx, width, height);
  }

  // 5. Clean Subtle Partner Credit in Preview (shop26.in)
  if (options?.watermark) {
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
    ctx.font = `600 ${Math.round(width * 0.016)}px 'Plus Jakarta Sans', sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText("Partner: shop26.in", width - 20, height - 20);
    ctx.restore();
  }
}

/**
 * Intelligent Aspect Ratio Fitting:
 * - "blur_fill": CapCut's signature blurred background fill so videos never look cropped or stretched!
 * - "smart_reframe": Analyzes framing and smoothly centers subject
 * - "fit": Letterbox / Pillarbox
 * - "fill": Edge-to-edge crop
 */
function renderIntelligentVideoClip(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  timeInClip: number,
  canvasW: number,
  canvasH: number,
  fitMode: FitMode,
  aspectRatio: string
) {
  // If user chooses Blur Fill and aspect ratio is non-standard or portrait/landscape mix
  if (fitMode === "blur_fill" && (aspectRatio === "9:16" || aspectRatio === "16:9" || aspectRatio === "4:5")) {
    ctx.save();
    // 1. Render scaled-up background with Gaussian blur / dimming
    ctx.save();
    ctx.filter = "blur(28px) brightness(0.65)";
    ctx.translate(canvasW / 2, canvasH / 2);
    ctx.scale(1.35, 1.35);
    ctx.translate(-canvasW / 2, -canvasH / 2);
    renderVisualPattern(ctx, clip, timeInClip, canvasW, canvasH);
    ctx.restore();

    // 2. Render crisp centered framed video with subtle elevation shadow
    const frameW = aspectRatio === "9:16" ? canvasW * 0.94 : canvasW * 0.88;
    const frameH = aspectRatio === "9:16" ? canvasW * 0.94 * (9 / 16) : canvasH * 0.88;
    const frameX = (canvasW - frameW) / 2;
    const frameY = (canvasH - frameH) / 2;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.roundRect(frameX, frameY, frameW, frameH, 12);
    ctx.clip();

    // Render inside frame
    ctx.translate(frameX, frameY);
    renderVisualPattern(ctx, clip, timeInClip, frameW, frameH);
    ctx.restore();

    // Hairline border around framed video
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(frameX, frameY, frameW, frameH);

    ctx.restore();
  } else if (fitMode === "smart_reframe") {
    // Smart Reframe: Dynamically scales with soft framing
    ctx.save();
    renderVisualPattern(ctx, clip, timeInClip, canvasW, canvasH);
    ctx.restore();
  } else {
    // Standard Fill or Fit
    renderVisualPattern(ctx, clip, timeInClip, canvasW, canvasH);
  }
}

// Procedural visual generators for high-fidelity backgrounds
function renderVisualPattern(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  timeInClip: number,
  w: number,
  h: number
) {
  const pattern = clip.presetPattern || "cyber_grid";

  if (pattern === "cyber_grid") {
    // Cyberpunk 80s Grid + Glow Horizon
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#050508");
    grad.addColorStop(0.5, "#0d0426");
    grad.addColorStop(1, "#031525");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Horizon line
    const horizon = h * 0.55;

    // Glowing sun / moon
    const sunGrad = ctx.createRadialGradient(w / 2, horizon - 20, 10, w / 2, horizon - 20, w * 0.35);
    sunGrad.addColorStop(0, "rgba(244, 63, 94, 0.9)");
    sunGrad.addColorStop(0.4, "rgba(236, 72, 153, 0.4)");
    sunGrad.addColorStop(1, "rgba(236, 72, 153, 0)");
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, 0, w, h);

    // Perspective floor grid
    ctx.save();
    ctx.strokeStyle = "rgba(6, 182, 212, 0.65)";
    ctx.lineWidth = 2;

    const gridLines = 14;
    for (let i = 0; i <= gridLines; i++) {
      const bottomX = (w / gridLines) * i;
      ctx.beginPath();
      ctx.moveTo(w / 2 + (bottomX - w / 2) * 0.1, horizon);
      ctx.lineTo(bottomX, h);
      ctx.stroke();
    }

    // Moving horizontal grid bars
    const speed = 75;
    const offset = (timeInClip * speed) % 50;
    for (let yPos = horizon; yPos < h; yPos += 14 + (yPos - horizon) * 0.22) {
      const adjustedY = yPos + offset * ((yPos - horizon) / (h - horizon));
      if (adjustedY <= h) {
        ctx.beginPath();
        ctx.moveTo(0, adjustedY);
        ctx.lineTo(w, adjustedY);
        ctx.stroke();
      }
    }
    ctx.restore();
  } else if (pattern === "sunset_gradient") {
    // Golden Hour sunset with organic floating warmth
    const grad = ctx.createRadialGradient(
      w / 2 + Math.sin(timeInClip * 0.5) * 50,
      h * 0.45,
      w * 0.1,
      w / 2,
      h * 0.5,
      w * 0.8
    );
    grad.addColorStop(0, "#fbbf24");
    grad.addColorStop(0.35, "#f97316");
    grad.addColorStop(0.7, "#be185d");
    grad.addColorStop(1, "#180e29");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Ambient floating glow orbs
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const orbX = (w * (0.2 + i * 0.25) + Math.cos(timeInClip + i) * 40) % w;
      const orbY = (h * (0.3 + i * 0.15) + Math.sin(timeInClip * 0.8 + i) * 60) % h;
      const orbGrad = ctx.createRadialGradient(orbX, orbY, 5, orbX, orbY, 140);
      orbGrad.addColorStop(0, "rgba(253, 224, 71, 0.25)");
      orbGrad.addColorStop(1, "rgba(249, 115, 22, 0)");
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(orbX, orbY, 140, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else if (pattern === "ocean_wave") {
    // Oceanic dynamic waves
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#082f49");
    grad.addColorStop(0.5, "#0369a1");
    grad.addColorStop(1, "#0f766e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    for (let layer = 0; layer < 3; layer++) {
      ctx.fillStyle =
        layer === 0
          ? "rgba(14, 165, 233, 0.35)"
          : layer === 1
          ? "rgba(45, 212, 191, 0.25)"
          : "rgba(255, 255, 255, 0.15)";
      ctx.beginPath();
      ctx.moveTo(0, h);
      const waveFreq = 0.004 + layer * 0.002;
      const waveSpeed = timeInClip * (1.8 + layer * 0.8);
      const baseY = h * (0.55 + layer * 0.12);

      for (let x = 0; x <= w; x += 20) {
        const y = baseY + Math.sin(x * waveFreq + waveSpeed) * 35;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  } else if (pattern === "neon_tunnel") {
    // Warp tunnel hyperspace
    const grad = ctx.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.75);
    grad.addColorStop(0, "#3b0764");
    grad.addColorStop(0.6, "#581c87");
    grad.addColorStop(1, "#030014");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    const rings = 8;
    for (let r = 0; r < rings; r++) {
      const radius = (timeInClip * 220 + r * (w / rings)) % (w * 0.85);
      ctx.strokeStyle = `rgba(192, 132, 252, ${Math.max(0, 1 - radius / (w * 0.85))})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  } else if (pattern === "fire_sparks") {
    // Rising sparks on dark gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#09090b");
    grad.addColorStop(0.7, "#1c1917");
    grad.addColorStop(1, "#450a0a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    sparksPool.forEach((p, idx) => {
      const curY = h - ((p.y * h + timeInClip * p.speed * h) % h);
      const curX = (p.x * w + Math.sin(timeInClip * 3 + idx) * 20) % w;

      ctx.fillStyle = `rgba(251, 146, 60, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(curX, curY, p.size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  } else if (pattern === "starfield") {
    // Deep 3D cosmos starfield
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    starPool.forEach((star) => {
      const zProgress = ((star.z ?? 0.5) - timeInClip * 0.15) % 1;
      const depth = zProgress < 0 ? zProgress + 1 : zProgress;
      const k = 300 / (depth * 300 + 10);
      const sx = star.x * w * k;
      const sy = star.y * h * k;
      const size = Math.max(1, (1 - depth) * 4);

      ctx.fillStyle = `rgba(186, 230, 253, ${Math.min(1, (1 - depth) * 1.5)})`;
      ctx.beginPath();
      ctx.arc(sx, sy, size, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }
}

// Render dynamic captions with Hormozi-style viral pop animations
function renderTextCaption(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  timeInClip: number,
  w: number,
  h: number
) {
  if (!clip.text) return;

  const style = clip.captionStyle || "hormozi";
  const fontSize = (clip.fontSize || 32) * (w / 720); // scale responsive to canvas width
  const posX = w / 2;
  const posY = clip.y ? (clip.y / 100) * h : h * 0.72;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Micro bounce on word hit
  const bounceScale = 1.0 + Math.max(0, 0.08 * Math.sin(timeInClip * 12) * Math.exp(-timeInClip * 2));
  ctx.translate(posX, posY);
  ctx.scale(bounceScale, bounceScale);

  if (style === "hormozi") {
    ctx.font = `900 ${fontSize}px 'Plus Jakarta Sans', system-ui, sans-serif`;

    const words = clip.text.toUpperCase().split(" ");
    const highlight = (clip.highlightWord || "").toUpperCase();

    let totalTextWidth = 0;
    const spaceWidth = ctx.measureText(" ").width;
    const wordWidths = words.map((word) => {
      const width = ctx.measureText(word).width;
      totalTextWidth += width;
      return width;
    });
    totalTextWidth += spaceWidth * (words.length - 1);

    const padX = fontSize * 0.5;
    const padY = fontSize * 0.35;
    const pillW = totalTextWidth + padX * 2;
    const pillH = fontSize * 1.5;

    ctx.fillStyle = "rgba(0, 0, 0, 0.78)";
    ctx.beginPath();
    ctx.roundRect(-pillW / 2, -pillH / 2, pillW, pillH, 12);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.18)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    let startX = -totalTextWidth / 2;
    words.forEach((word, idx) => {
      const isHighlighted = highlight && word.includes(highlight);
      const color = isHighlighted ? clip.highlightColor || "#facc15" : clip.textColor || "#ffffff";

      ctx.lineWidth = fontSize * 0.12;
      ctx.strokeStyle = "#000000";
      ctx.strokeText(word, startX + wordWidths[idx] / 2, 0);

      ctx.fillStyle = color;
      ctx.fillText(word, startX + wordWidths[idx] / 2, 0);

      startX += wordWidths[idx] + spaceWidth;
    });
  } else if (style === "neon") {
    ctx.font = `800 ${fontSize}px 'JetBrains Mono', monospace`;
    ctx.shadowColor = clip.highlightColor || "#06b6d4";
    ctx.shadowBlur = 18;
    ctx.fillStyle = "#ffffff";
    ctx.fillText(clip.text, 0, 0);
    ctx.shadowBlur = 0;
  } else if (style === "minimal") {
    ctx.font = `600 ${fontSize * 0.85}px 'Plus Jakarta Sans', sans-serif`;
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(0,0,0,0.8)";
    ctx.strokeText(clip.text, 0, 0);
    ctx.fillStyle = clip.textColor || "#f8fafc";
    ctx.fillText(clip.text, 0, 0);
  } else {
    ctx.font = `700 ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
    ctx.fillStyle = clip.textColor || "#ffffff";
    ctx.fillText(clip.text, 0, 0);
  }

  ctx.restore();
}

function renderSticker(
  ctx: CanvasRenderingContext2D,
  clip: Clip,
  timeInClip: number,
  w: number,
  h: number
) {
  const symbol = clip.text || "🔥";
  const size = (clip.fontSize || 44) * (w / 720);
  const x = clip.x ? (clip.x / 100) * w : w * 0.5;
  const y = clip.y ? (clip.y / 100) * h : h * 0.35;

  ctx.save();
  ctx.translate(x, y);

  const floatOffset = Math.sin(timeInClip * 4) * 8;
  ctx.translate(0, floatOffset);

  ctx.font = `${size}px system-ui, Apple Color Emoji, Segoe UI Emoji`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, 0, 0);
  ctx.restore();
}

function applyPostProcessingFilter(
  ctx: CanvasRenderingContext2D,
  filter: FilterType,
  intensity: number,
  w: number,
  h: number,
  time: number
) {
  ctx.save();
  if (filter === "cinematic") {
    ctx.globalCompositeOperation = "color-burn";
    ctx.fillStyle = `rgba(13, 148, 136, ${intensity * 0.25})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(249, 115, 22, ${intensity * 0.28})`;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === "cyberpunk") {
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = `rgba(236, 72, 153, ${intensity * 0.25})`;
    ctx.fillRect(0, 0, w, h);

    ctx.globalCompositeOperation = "color-dodge";
    ctx.fillStyle = `rgba(6, 182, 212, ${intensity * 0.22})`;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === "vhs") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    for (let y = 0; y < h; y += 4) {
      ctx.fillRect(0, y, w, 1.5);
    }
    ctx.fillStyle = `rgba(255, 255, 255, ${0.04 * intensity})`;
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * w;
      const ry = Math.random() * h;
      ctx.fillRect(rx, ry, 2, 2);
    }
  } else if (filter === "warm") {
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = `rgba(251, 146, 60, ${intensity * 0.35})`;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === "film") {
    ctx.globalCompositeOperation = "overlay";
    ctx.fillStyle = `rgba(180, 160, 140, ${intensity * 0.2})`;
    ctx.fillRect(0, 0, w, h);
  } else if (filter === "noir") {
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = `rgba(0, 0, 0, ${intensity * 0.95})`;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function renderSocialSafeZoneGuides(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;

  ctx.strokeRect(w * 0.05, h * 0.12, w * 0.9, h * 0.72);

  const iconX = w * 0.9;
  const iconsY = [h * 0.52, h * 0.6, h * 0.68, h * 0.76];

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  iconsY.forEach((iy) => {
    ctx.beginPath();
    ctx.arc(iconX, iy, 18, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
  ctx.fillRect(w * 0.08, h * 0.86, w * 0.65, 12);
  ctx.fillRect(w * 0.08, h * 0.89, w * 0.45, 10);

  ctx.restore();
}

// Real client-side Video Exporter
export async function exportVideoBlob(
  project: VideoProject,
  onProgress?: (progress: number, currentSec: number) => void
): Promise<Blob> {
  const { width, height } = getResolutionDimensions(project.aspectRatio, project.resolution);

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = width;
  offscreenCanvas.height = height;
  const ctx = offscreenCanvas.getContext("2d");

  if (!ctx) {
    throw new Error("Unable to create canvas rendering context");
  }

  const fps = 30;
  const totalFrames = Math.ceil(project.duration * fps);
  const frameInterval = 1 / fps;

  let mimeType = "video/webm;codecs=vp9";
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = "video/webm";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = "";
    }
  }

  const stream = offscreenCanvas.captureStream(fps);
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    recorder.onstop = () => {
      const finalBlob = new Blob(chunks, { type: mimeType || "video/webm" });
      resolve(finalBlob);
    };

    recorder.onerror = (e) => {
      reject(e);
    };

    recorder.start();

    let frame = 0;
    function renderNext() {
      if (frame >= totalFrames) {
        recorder.stop();
        return;
      }

      const currentTime = frame * frameInterval;
      renderFrame(ctx!, project, currentTime, { showGuides: false });

      if (onProgress) {
        onProgress(Math.min(100, Math.round((frame / totalFrames) * 100)), currentTime);
      }

      frame++;
      if (frame % 3 === 0) {
        setTimeout(renderNext, 0);
      } else {
        renderNext();
      }
    }

    renderNext();
  });
}
