import express, { Request, Response } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Fallback template builder for resilience
function generateSmartFallbackTemplate(topic: string, platform: string, style: string, duration: number) {
  const safeTopic = topic || "Viral Creator Routine";
  const numScenes = Math.max(3, Math.min(6, Math.round(duration / 3.5)));
  const sceneDuration = Number((duration / numScenes).toFixed(1));

  const sceneTypes: ("cyber_grid" | "sunset_gradient" | "ocean_wave" | "starfield")[] = [
    "cyber_grid",
    "ocean_wave",
    "sunset_gradient",
    "starfield",
  ];

  const transitions = ["zoom_in", "whip_pan", "flash", "glitch", "crossfade"];

  const scenes = Array.from({ length: numScenes }, (_, i) => {
    const startTime = Number((i * sceneDuration).toFixed(1));
    const isFirst = i === 0;
    const isLast = i === numScenes - 1;

    let voiceoverOrText = `${safeTopic.toUpperCase()} PART ${i + 1}`;
    if (isFirst) {
      voiceoverOrText = `STOP SCROLLING 🛑 ${safeTopic.toUpperCase()}`;
    } else if (isLast) {
      voiceoverOrText = "SAVE THIS REEL FOR LATER 🔥";
    }

    return {
      id: `scene_${i + 1}`,
      startTime,
      duration: sceneDuration,
      title: isFirst ? "Hook Frame" : isLast ? "Retention CTA" : `Value Step ${i}`,
      visualDescription: `Cinematic motion designed to maximize watch time on ${platform}`,
      visualPresetType: sceneTypes[i % sceneTypes.length],
      voiceoverOrText,
      captionAnimation: "hormozi",
      transition: transitions[i % transitions.length],
    };
  });

  return {
    templateName: `${safeTopic} - Viral Cut`,
    description: `High-retention ${duration}s template with synchronized downbeats and punchy Hormozi captions.`,
    targetAspectRatio: platform === "youtube" ? "16:9" : "9:16",
    musicVibe: style === "aesthetic" ? "Lo-Fi Chill (85 BPM)" : "Phonk Upbeat (130 BPM)",
    colorGrade: style === "aesthetic" ? "warm" : "cyberpunk",
    scenes,
    viralTips: [
      "Keep the visual hook in the first 2.5 seconds to retain over 70% of viewers.",
      "Sync cut points to bass downbeats to reset audience dopamine levels.",
      "Position captions in the middle third to avoid being blocked by TikTok interface icons.",
    ],
  };
}

// 1. AI Video Template Generator
app.post("/api/ai/template", async (req: Request, res: Response) => {
  const { topic, platform = "tiktok", style = "dynamic", duration = 15 } = req.body;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a professional viral short-form video editor specializing in CapCut / TikTok / Instagram Reels.
Generate a complete, high-converting video template structure for the following request:
Topic: "${topic || "Morning Motivation Routine"}"
Target Platform: "${platform}" (e.g. tiktok, reels, youtube_shorts)
Editing Style: "${style}" (e.g. dynamic, minimalist, luxury, beat_sync, storytelling)
Target Duration: ${duration} seconds.

Output a structured JSON object containing:
- templateName: Catchy template title
- description: Short hook description
- targetAspectRatio: "9:16" or "16:9" or "1:1"
- musicVibe: Recommended soundtrack tempo and genre (e.g., "Phonk Upbeat 135 BPM", "Lo-Fi Chill Hop 85 BPM")
- colorGrade: "cinematic" | "cyberpunk" | "vhs" | "warm" | "film" | "none"
- scenes: Array of scenes (each lasting between 2 to 5 seconds, totaling ~${duration}s):
  - id: string
  - startTime: number (in seconds)
  - duration: number (in seconds)
  - title: short scene title
  - visualDescription: detailed description of what should be seen
  - visualPresetType: "cyber_grid" | "sunset_gradient" | "ocean_wave" | "starfield"
  - voiceoverOrText: The exact punchy voiceover narration / on-screen hook caption text
  - captionAnimation: "hormozi" | "neon" | "minimal"
  - transition: "zoom_in" | "glitch" | "whip_pan" | "flash" | "crossfade" | "slide_left"
- viralTips: 3 bullet points for maximizing retention and watch time on this template.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              templateName: { type: Type.STRING },
              description: { type: Type.STRING },
              targetAspectRatio: { type: Type.STRING },
              musicVibe: { type: Type.STRING },
              colorGrade: { type: Type.STRING },
              scenes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    duration: { type: Type.NUMBER },
                    title: { type: Type.STRING },
                    visualDescription: { type: Type.STRING },
                    visualPresetType: { type: Type.STRING },
                    voiceoverOrText: { type: Type.STRING },
                    captionAnimation: { type: Type.STRING },
                    transition: { type: Type.STRING },
                  },
                  required: ["id", "startTime", "duration", "title", "visualDescription", "voiceoverOrText"],
                },
              },
              viralTips: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ["templateName", "description", "scenes"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && parsed.scenes && parsed.scenes.length > 0) {
        return res.json(parsed);
      }
    }
  } catch (error: any) {
    console.warn("Gemini template generation fallback activated:", error?.message || error);
  }

  // Graceful fallback to guarantee seamless user experience
  const fallback = generateSmartFallbackTemplate(topic, platform, style, duration);
  res.json(fallback);
});

// 2. AI Auto Captions Generator
app.post("/api/ai/captions", async (req: Request, res: Response) => {
  const { text = "Stop scrolling right now. This is the editing secret you need.", totalDuration = 10, style = "hormozi" } = req.body;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an automated speech recognition and caption sync engine for CapCut.
Given this video narration or topic script:
"${text}"

Total Video Duration: ${totalDuration} seconds.
Caption Style: "${style}" (e.g. "hormozi", "minimal", "neon", "classic")

Break this narration into timed caption segments (each segment containing 2-5 words, timed realistically across 0 to ${totalDuration} seconds).
Also identify 1-2 highlight words in each segment that should be colored bright yellow or green.

Output JSON:
{
  "captions": [
    {
      "id": "c1",
      "startTime": 0.0,
      "endTime": 2.2,
      "text": "STOP SCROLLING RIGHT NOW",
      "highlightWord": "STOP",
      "emphasisColor": "#EAB308"
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              captions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    startTime: { type: Type.NUMBER },
                    endTime: { type: Type.NUMBER },
                    text: { type: Type.STRING },
                    highlightWord: { type: Type.STRING },
                    emphasisColor: { type: Type.STRING },
                  },
                  required: ["id", "startTime", "endTime", "text"],
                },
              },
            },
            required: ["captions"],
          },
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && parsed.captions && parsed.captions.length > 0) {
        return res.json(parsed);
      }
    }
  } catch (error: any) {
    console.warn("Gemini captions fallback activated:", error?.message || error);
  }

  // Fallback captions generator
  const words = (text || "Stop scrolling right now. This is the secret.").split(" ");
  const chunkSize = 3;
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += chunkSize) {
    chunks.push(words.slice(i, i + chunkSize).join(" "));
  }
  const segDur = Number((totalDuration / Math.max(1, chunks.length)).toFixed(2));
  const fallbackCaptions = chunks.map((chunk, idx) => ({
    id: `c_${idx + 1}`,
    startTime: Number((idx * segDur).toFixed(2)),
    endTime: Number(((idx + 1) * segDur).toFixed(2)),
    text: chunk.toUpperCase(),
    highlightWord: chunk.split(" ")[0]?.toUpperCase() || "",
    emphasisColor: "#facc15",
  }));

  res.json({ captions: fallbackCaptions });
});

// 3. AI Social Media Package Generator
app.post("/api/ai/social-package", async (req: Request, res: Response) => {
  const { title = "Viral Video", videoSummary = "", duration = 15 } = req.body;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are a top social media growth strategist for TikTok, Instagram Reels, and YouTube Shorts.
Generate an optimized multi-platform publishing package for this video:
Video Title: "${title}"
Summary / Content: "${videoSummary}"
Duration: ${duration}s

Provide tailored content for:
1. TikTok (high hook density, trending tags, sound suggestions)
2. Instagram Reels (aesthetic, relatable caption, strategic engagement prompt)
3. YouTube Shorts (high CTR title, search-friendly tags, pinned comment)

Output JSON:
{
  "tiktok": {
    "caption": "Short punchy caption with line breaks",
    "hashtags": ["#fyp", "#viral", "#foryou", "#edits"],
    "recommendedAudio": "Trending drill beat or aesthetic lo-fi",
    "first3SecHookTip": "What to show in the first 3 seconds to avoid scroll"
  },
  "instagram": {
    "caption": "Clean micro-blog style caption with call to action",
    "hashtags": ["#reelsvideo", "#creator", "#contentcreation"],
    "callToAction": "Save this reel for your next edit"
  },
  "youtubeShorts": {
    "title": "Title with high CTR under 60 characters",
    "description": "Short description with keywords",
    "pinnedComment": "Question to spark comment section debate"
  }
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && (parsed.tiktok || parsed.platforms?.tiktok)) {
        return res.json(parsed.platforms || parsed);
      }
    }
  } catch (error: any) {
    console.warn("Gemini social package fallback activated:", error?.message || error);
  }

  // Fallback social package
  res.json({
    tiktok: {
      caption: `This editing trick will change the way you make videos! 🤯\n\nDrop a comment if you want the full tutorial breakdown.`,
      hashtags: ["#fyp", "#viral", "#capcut", "#videoediting", "#creator"],
      recommendedAudio: "Night Drift (Slowed Phonk 130 BPM)",
      first3SecHookTip: "Cut directly to the high-impact visual frame in the first 1.5 seconds.",
    },
    instagram: {
      caption: `Save this editing blueprint for your next reel. ⚡ High-energy cuts, synchronized downbeats, and Hormozi-style captions increase completion rate by 80%.`,
      hashtags: ["#reelsviral", "#contentcreator", "#videoeditor", "#capcutedit"],
      callToAction: "Save & share this with a fellow creator!",
    },
    youtubeShorts: {
      title: `${title} - The Ultimate Editing Workflow`,
      description: "Quick tutorial breakdown on creating viral short-form videos with synced dynamic captions.",
      pinnedComment: "Which transition style do you use the most in your edits?",
    },
  });
});

// 4. AI Media Analyzer to suggest best template from the 5 distinct styles
app.post("/api/ai/analyze-media", async (req: Request, res: Response) => {
  const { mediaDescription = "Short video clips and photos", filesCount = 3 } = req.body;

  try {
    const ai = getGeminiClient();

    if (ai) {
      const prompt = `You are an AI video editor director like CapCut.
Analyze this user's input media:
Media Description: "${mediaDescription}"
Total Media Files: ${filesCount}

Based on this content, select the single best template among these 5 distinct styles:
1. "tpl_viral_fastcut" (Viral Fast-Cut Hook, 9:16, 130 BPM Phonk, talking heads, punchy tips)
2. "tpl_cinematic_story" (Cinematic Storytelling Vlog, 16:9 / 9:16, 85 BPM Lo-Fi, nature/lifestyle/coffee)
3. "tpl_ecommerce_showcase" (E-Commerce Product Showcase, 1:1, 115 BPM Upbeat, products/apparel/unboxing)
4. "tpl_travel_montage" (Aesthetic Travel Montage, 9:16, 120 BPM Tropical, beaches/cities/vacation)
5. "tpl_gaming_tech" (High-Energy Gaming & Tech, 16:9, 140 BPM Cyber Synth, gameplay/overclock/gadgets)

Output JSON:
{
  "recommendedTemplateId": "tpl_viral_fastcut" | "tpl_cinematic_story" | "tpl_ecommerce_showcase" | "tpl_travel_montage" | "tpl_gaming_tech",
  "detectedVibe": "string",
  "optimalPlatform": "TikTok / Reels" | "YouTube" | "Instagram Square",
  "colorPalette": "string",
  "musicSuggestion": "string",
  "reasoning": "1 sentence explanation why this template fits best"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const parsed = JSON.parse(response.text || "{}");
      if (parsed && parsed.recommendedTemplateId) {
        return res.json(parsed);
      }
    }
  } catch (error: any) {
    console.warn("Media analyzer fallback activated:", error?.message || error);
  }

  // Fallback matching
  const desc = mediaDescription.toLowerCase();
  let recommendedId = "tpl_cinematic_story";
  let vibe = "Aesthetic Lifestyle Narrative";
  let platform = "Instagram Reels / YouTube Shorts";
  let music = "Tokyo Train Sunset (Lo-Fi 85 BPM)";
  let color = "Warm Amber & 35mm Grain";

  if (desc.includes("product") || desc.includes("unbox") || desc.includes("shop") || desc.includes("store")) {
    recommendedId = "tpl_ecommerce_showcase";
    vibe = "Clean Commercial E-Commerce";
    platform = "Instagram Square 1:1 Feed";
    music = "Modern Upbeat Commercial (115 BPM)";
    color = "Studio Clean Contrast";
  } else if (desc.includes("travel") || desc.includes("beach") || desc.includes("trip") || desc.includes("vacation")) {
    recommendedId = "tpl_travel_montage";
    vibe = "Sunlit Wanderlust Reel";
    platform = "TikTok / Instagram Reels 9:16";
    music = "Tropical Sunset Groove (120 BPM)";
    color = "Golden Hour Teal & Orange";
  } else if (desc.includes("game") || desc.includes("tech") || desc.includes("gpu") || desc.includes("pc")) {
    recommendedId = "tpl_gaming_tech";
    vibe = "High-Energy Cyber Tech Review";
    platform = "YouTube 16:9 & Shorts";
    music = "Cyber Synth Bass (140 BPM)";
    color = "Neon Cyan & Magenta Glitch";
  } else if (desc.includes("viral") || desc.includes("hook") || desc.includes("talking")) {
    recommendedId = "tpl_viral_fastcut";
    vibe = "High-Retention Viral Hook";
    platform = "TikTok / Reels 9:16";
    music = "Night Drift (130 BPM Phonk)";
    color = "High Contrast Cyberpunk";
  }

  res.json({
    recommendedTemplateId: recommendedId,
    detectedVibe: vibe,
    optimalPlatform: platform,
    colorPalette: color,
    musicSuggestion: music,
    reasoning: "Matched to optimize viewer retention and highlight visual transitions.",
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== "true" },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, () => {
    console.log(`AI Cut Video Editor server running at http://localhost:${PORT}`);
  });
}

startServer();
