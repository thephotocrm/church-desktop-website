import OpenAI from "openai";
import sharp from "sharp";

import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

// --- Programmatic Pastor + Title types and data ---

export type PastorLayout = "left" | "right";

interface RGBColor { r: number; g: number; b: number }
interface GradientPalette {
  name: string;
  dark: RGBColor;
  mid: RGBColor;
  light: RGBColor;
  accent: RGBColor;
}

const GRADIENT_PALETTES: GradientPalette[] = [
  { name: "royal-blue-teal",      dark: { r: 10,  g: 15,  b: 50  }, mid: { r: 20,  g: 60,  b: 130 }, light: { r: 40,  g: 160, b: 200 }, accent: { r: 80,  g: 220, b: 255 } },
  { name: "deep-purple-magenta",  dark: { r: 25,  g: 10,  b: 50  }, mid: { r: 80,  g: 20,  b: 100 }, light: { r: 160, g: 60,  b: 180 }, accent: { r: 220, g: 100, b: 255 } },
  { name: "sunset-orange-gold",   dark: { r: 40,  g: 15,  b: 10  }, mid: { r: 160, g: 60,  b: 20  }, light: { r: 240, g: 160, b: 40  }, accent: { r: 255, g: 220, b: 80  } },
  { name: "crimson-maroon",       dark: { r: 35,  g: 8,   b: 15  }, mid: { r: 140, g: 20,  b: 40  }, light: { r: 200, g: 60,  b: 80  }, accent: { r: 255, g: 180, b: 100 } },
  { name: "emerald-lime",         dark: { r: 8,   g: 30,  b: 15  }, mid: { r: 20,  g: 100, b: 60  }, light: { r: 40,  g: 200, b: 120 }, accent: { r: 150, g: 255, b: 180 } },
  { name: "indigo-electric",      dark: { r: 15,  g: 10,  b: 60  }, mid: { r: 50,  g: 30,  b: 150 }, light: { r: 100, g: 80,  b: 220 }, accent: { r: 180, g: 140, b: 255 } },
  { name: "hot-pink-coral",       dark: { r: 40,  g: 10,  b: 25  }, mid: { r: 180, g: 40,  b: 80  }, light: { r: 255, g: 100, b: 130 }, accent: { r: 255, g: 180, b: 200 } },
  { name: "deep-teal-turquoise",  dark: { r: 5,   g: 25,  b: 40  }, mid: { r: 15,  g: 80,  b: 110 }, light: { r: 40,  g: 190, b: 200 }, accent: { r: 120, g: 255, b: 240 } },
  { name: "bronze-amber",         dark: { r: 30,  g: 18,  b: 8   }, mid: { r: 140, g: 90,  b: 30  }, light: { r: 220, g: 170, b: 60  }, accent: { r: 255, g: 230, b: 130 } },
  { name: "midnight-silver",      dark: { r: 12,  g: 12,  b: 25  }, mid: { r: 50,  g: 55,  b: 80  }, light: { r: 120, g: 130, b: 160 }, accent: { r: 200, g: 210, b: 240 } },
];

type TextureType = "grain" | "waves" | "checkers" | "diagonal-lines" | "dots";
const TEXTURE_TYPES: TextureType[] = ["grain", "waves", "checkers", "diagonal-lines", "dots"];

// Anti-repeat for programmatic pastor-title
const recentProgrammaticCombos: Array<[number, number]> = [];
const PROGRAMMATIC_HISTORY_SIZE = 8;

function pickProgrammaticCombo(): { paletteIdx: number; textureIdx: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
      textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
    };
    const tooSimilar = recentProgrammaticCombos.some(
      ([p, t]) => p === c.paletteIdx && t === c.textureIdx
    );
    if (!tooSimilar) {
      recentProgrammaticCombos.push([c.paletteIdx, c.textureIdx]);
      if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
      return c;
    }
  }
  const f = {
    paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
    textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
  };
  recentProgrammaticCombos.push([f.paletteIdx, f.textureIdx]);
  if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
  return f;
}

async function createGradientLayer(
  width: number, height: number, palette: GradientPalette, layout: PastorLayout
): Promise<Buffer> {
  const qw = Math.max(1, Math.round(width / 4));
  const qh = Math.max(1, Math.round(height / 4));
  const buf = Buffer.alloc(qw * qh * 3);

  const glowCx = layout === "right" ? 0.75 : 0.25;
  const glowCy = 0.50;
  const glowRadius = 0.5;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / qw;
      const ny = y / qh;

      // Horizontal gradient: dark → light toward pastor side
      const t = layout === "right" ? nx : 1 - nx;
      let baseR: number, baseG: number, baseB: number;
      if (t < 0.5) {
        const s = t / 0.5;
        baseR = palette.dark.r + (palette.mid.r - palette.dark.r) * s;
        baseG = palette.dark.g + (palette.mid.g - palette.dark.g) * s;
        baseB = palette.dark.b + (palette.mid.b - palette.dark.b) * s;
      } else {
        const s = (t - 0.5) / 0.5;
        baseR = palette.mid.r + (palette.light.r - palette.mid.r) * s;
        baseG = palette.mid.g + (palette.light.g - palette.mid.g) * s;
        baseB = palette.mid.b + (palette.light.b - palette.mid.b) * s;
      }

      // Radial glow behind pastor
      const dx = nx - glowCx;
      const dy = (ny - glowCy) * 1.3;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const glowStrength = Math.max(0, 1 - dist / glowRadius);
      const glowFactor = glowStrength * glowStrength * 0.6;

      const r = Math.round(Math.min(255, baseR + (palette.accent.r - baseR) * glowFactor));
      const g = Math.round(Math.min(255, baseG + (palette.accent.g - baseG) * glowFactor));
      const b = Math.round(Math.min(255, baseB + (palette.accent.b - baseB) * glowFactor));

      const idx = (y * qw + x) * 3;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
    }
  }

  return sharp(buf, { raw: { width: qw, height: qh, channels: 3 } })
    .resize(width, height, { fit: "fill" })
    .blur(Math.max(1, Math.round(width / 30)))
    .png()
    .toBuffer();
}

async function createTextureLayer(
  width: number, height: number, textureType: TextureType, opacity: number
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height * 4);
  const alpha = Math.round(opacity * 255);

  // Hoist any per-call randomness outside the loop
  const waveFreq = 0.015 + Math.random() * 0.015;
  const wavePhase = Math.random() * Math.PI * 2;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let v = 0;
      const idx = (y * width + x) * 4;

      switch (textureType) {
        case "grain":
          v = Math.floor(Math.random() * 256);
          break;
        case "waves": {
          const wave = Math.sin(x * waveFreq + y * 0.008 + wavePhase) * 0.5 + 0.5;
          v = Math.round(wave * 255);
          break;
        }
        case "checkers": {
          const cx = Math.floor(x / 40);
          const cy = Math.floor(y / 40);
          v = (cx + cy) % 2 === 0 ? 200 : 60;
          break;
        }
        case "diagonal-lines": {
          const diag = (x + y) % 30;
          v = diag < 4 ? 220 : 40;
          break;
        }
        case "dots": {
          const dx = (x % 50) - 25;
          const dy = (y % 50) - 25;
          const d = Math.sqrt(dx * dx + dy * dy);
          v = d < 8 ? 200 : 30;
          break;
        }
      }

      buf[idx] = v;
      buf[idx + 1] = v;
      buf[idx + 2] = v;
      buf[idx + 3] = alpha;
    }
  }

  return sharp(buf, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

async function createTitleLayer(
  width: number, height: number, title: string, layout: PastorLayout
): Promise<Buffer> {
  const textZoneWidth = Math.round(width * 0.40);
  const wordCount = title.trim().split(/\s+/).length;
  let fontSize: number;
  if (wordCount <= 2) fontSize = Math.round(height * 0.14);
  else if (wordCount <= 4) fontSize = Math.round(height * 0.11);
  else fontSize = Math.round(height * 0.08);

  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").toUpperCase();
  const pangoMarkup = `<span foreground="white" font_desc="DejaVu Sans Bold ${fontSize}px">${escaped}</span>`;

  const textImage = await sharp({
    text: {
      text: pangoMarkup,
      rgba: true,
      width: textZoneWidth,
      align: "centre",
      justify: false,
      dpi: 72,
    },
  }).png().toBuffer();

  const textMeta = await sharp(textImage).metadata();
  const textW = textMeta.width!;
  const textH = textMeta.height!;

  // Center text in the text zone (opposite side from pastor)
  const textZoneX = layout === "right" ? width * 0.05 : width * 0.55;
  const left = Math.round(textZoneX + (textZoneWidth - textW) / 2);
  const top = Math.round((height - textH) / 2);

  // Create drop shadow
  const shadowImage = await sharp(textImage)
    .ensureAlpha()
    .tint({ r: 0, g: 0, b: 0 })
    .blur(8)
    .toBuffer();

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: shadowImage, left: Math.max(0, left + 4), top: Math.max(0, top + 4), blend: "over" },
      { input: textImage, left: Math.max(0, left), top: Math.max(0, top), blend: "over" },
    ])
    .png()
    .toBuffer();
}

async function fetchAndPrepPastor(
  pastorImageUrl: string, width: number, height: number, layout: PastorLayout
): Promise<Buffer> {
  const response = await fetch(pastorImageUrl);
  if (!response.ok) throw new Error(`Failed to fetch pastor image: ${response.status}`);
  const pastorBuffer = Buffer.from(await response.arrayBuffer());

  const meta = await sharp(pastorBuffer).metadata();
  const origW = meta.width!;
  const origH = meta.height!;

  // Scale to fit pastor zone (~50% width) maintaining aspect ratio
  const zoneWidth = Math.round(width * 0.50);
  const zoneHeight = height;
  const scale = Math.min(zoneWidth / origW, zoneHeight / origH);
  const scaledW = Math.round(origW * scale);
  const scaledH = Math.round(origH * scale);

  const scaledPastor = await sharp(pastorBuffer)
    .resize(scaledW, scaledH, { fit: "inside" })
    .ensureAlpha()
    .png()
    .toBuffer();

  // Position: bottom-aligned, centered in pastor half
  const zoneCenterX = layout === "right" ? Math.round(width * 0.75) : Math.round(width * 0.25);
  const left = Math.max(0, Math.round(zoneCenterX - scaledW / 2));
  const top = Math.max(0, height - scaledH);

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: scaledPastor, left, top, blend: "over" }])
    .png()
    .toBuffer();
}

// --- Variety pools for Title + Colored Background mode ---

const COLOR_PALETTES = [
  "warm dusty coral, soft peach, and muted rose blending into warm taupe, like a sun-faded fresco",
  "soft golden amber, warm honey, and creamy wheat tones with touches of burnt sienna, like late afternoon sunlight on old stone",
  "muted sage green, warm olive, and dusty cream with hints of soft terracotta, like a Tuscan landscape in soft focus",
  "dusty mauve, soft plum, and warm blush pink fading into pale champagne, like dried flowers in warm light",
  "deep navy, rich midnight blue, and dark indigo with silver and pale moonlight accents, like a clear night sky",
  "soft steel blue, warm dove gray, and pale cream with subtle lavender undertones, like an overcast sky at dawn",
  "muted teal, warm seafoam, and sandy beige with touches of dusty copper, like weathered coastal patina",
  "warm burgundy, dusty rose, and soft copper fading into antique cream, like aged leather and velvet",
  "rich forest green, deep emerald, and dark pine with aged gold and parchment accents, like an ancient woodland",
  "pale periwinkle, soft lilac, and warm silver with hints of blush, like early morning mist over a garden",
];

const DESIGN_ELEMENTS = [
  "soft watercolor paint washes gently bleeding into each other, wet-on-wet artistic texture with visible paper grain",
  "subtle canvas texture with gentle brushstroke marks, like an aged oil painting seen up close",
  "soft chalky pastel texture with gentle powder-like grain, matte and velvety like a renaissance fresco",
  "gentle washes of translucent color layered like glazes, soft and luminous with a hand-painted quality",
  "subtle linen or woven fabric texture underneath the color, giving warmth and tactile depth",
  "soft atmospheric fog and mist, colors dissolving gently into each other with no hard edges anywhere",
  "delicate plaster or stucco wall texture with subtle cracks and warmth, aged and beautiful",
  "gentle stippled or sponged paint texture, soft and organic with tiny variations in tone and density",
  "smooth matte gradient with the faintest hint of paper grain, minimal and serene like a meditation",
  "soft dry-brush texture with whisper-light strokes visible at the edges, painterly and effortless",
  "bold confident diagonal brush strokes sweeping across the canvas, thick painterly swooshes with visible bristle texture and layered overlap",
  "scattered organic paint splatters and spots of varying sizes, some crisp and some softly diffused, like an artist's drop cloth",
  "torn and layered paper collage shapes with soft edges, overlapping organic forms creating subtle depth and texture",
  "large sweeping curved brush arcs flowing across the canvas, calligraphic and graceful with tapered edges and paint buildup",
  "subtle cross-hatched pencil or charcoal lines beneath washes of color, a layered mixed-media feel with warmth and depth",
  "softly scattered leaf-like or petal-like organic shapes drifting across the canvas, translucent and layered at varying scales",
];

const COMPOSITIONS = [
  "glowing softly brighter in the center and gradually deepening toward the edges, a warm natural vignette",
  "sweeping gently on a diagonal from one corner to the opposite, colors flowing and transitioning smoothly",
  "blended in soft horizontal layers like a hazy landscape, warm tones settling naturally from top to bottom",
  "warmest and richest in the corners, softening and lightening toward the center to frame the text area",
  "shifting gradually from one side to the other, a gentle lateral gradient with organic color pooling",
  "softly mottled and organic across the entire canvas, no strong focal point, like a painted wall with natural color variation",
];

const FONT_STYLES = [
  "clean modern sans-serif font with strong bold weight, like Montserrat or Gotham",
  "tall condensed sans-serif font with impactful heavy weight, like Impact or Bebas Neue",
  "elegant thin serif font with refined letterforms, like Didot or Bodoni",
  "rounded friendly sans-serif font with medium weight, like Nunito or Poppins",
  "classic bold serif font with strong presence, like Georgia Bold or Playfair Display",
  "wide extended sans-serif font with generous letter spacing, like Oswald or Raleway",
  "hand-lettered brush script font with natural texture, bold and expressive",
  "geometric sans-serif font with clean precise letterforms, like Futura or Century Gothic",
];

// Anti-repeat ring buffer for title-background combos: stores last 12 combo indices
const recentCombos: Array<[number, number, number, number]> = [];
const HISTORY_SIZE = 12;

function pickDiverseCombo(): { palette: number; element: number; composition: number; font: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      palette: Math.floor(Math.random() * COLOR_PALETTES.length),
      element: Math.floor(Math.random() * DESIGN_ELEMENTS.length),
      composition: Math.floor(Math.random() * COMPOSITIONS.length),
      font: Math.floor(Math.random() * FONT_STYLES.length),
    };
    const tooSimilar = recentCombos.some(([p, e, co, f]) => {
      let m = 0;
      if (p === c.palette) m++;
      if (e === c.element) m++;
      if (co === c.composition) m++;
      if (f === c.font) m++;
      return m >= 2;
    });
    if (!tooSimilar) {
      recentCombos.push([c.palette, c.element, c.composition, c.font]);
      if (recentCombos.length > HISTORY_SIZE) recentCombos.shift();
      return c;
    }
  }
  // Fallback (extremely unlikely with 7680 combos vs 12 history)
  const f = {
    palette: Math.floor(Math.random() * COLOR_PALETTES.length),
    element: Math.floor(Math.random() * DESIGN_ELEMENTS.length),
    composition: Math.floor(Math.random() * COMPOSITIONS.length),
    font: Math.floor(Math.random() * FONT_STYLES.length),
  };
  recentCombos.push([f.palette, f.element, f.composition, f.font]);
  if (recentCombos.length > HISTORY_SIZE) recentCombos.shift();
  return f;
}

function buildServiceOverlayPrompt(title: string): string {
  return `Transform this image into a professional YouTube thumbnail for a church sermon titled "${title}". Use the provided image as a background scene — apply a subtle darkening overlay or color grade to make it serve as a cinematic backdrop. Do NOT preserve or highlight any specific person. Place large, bold, CENTERED text "${title}" prominently in the middle of the thumbnail. The text should be the dominant visual element — large, white or bright, with a clean modern sans-serif font. Add a slight text shadow or glow to ensure readability over the background image. The result should look like a professional YouTube thumbnail with the service scene creating atmosphere behind the title text. 16:9 aspect ratio.`;
}

function buildTitleColoredBgPrompt(title: string, subtitle?: string): { prompt: string; combo: { palette: number; element: number; composition: number; font: number } } {
  const combo = pickDiverseCombo();
  const palette = COLOR_PALETTES[combo.palette];
  const element = DESIGN_ELEMENTS[combo.element];
  const composition = COMPOSITIONS[combo.composition];
  const font = FONT_STYLES[combo.font];

  const textLines = [
    `TEXT PLACEMENT (CRITICAL — follow exactly):`,
    `Place the text PERFECTLY CENTERED — both horizontally and vertically in the image.`,
    `The text must have equal empty space on the left and right sides.`,
    `Do NOT place the text off to one side. It must be dead center.`,
    `The title text "${title}" must be large and bold — the dominant visual element.`,
    `Use a ${font}. The text should be white or very bright.`,
  ];

  if (subtitle) {
    textLines.push(
      `Directly below the main title, place smaller subtitle text "${subtitle}" in the same font but at roughly 40% the size of the main title.`,
      `The subtitle should be white or light-colored and clearly readable, but visually secondary to the main title.`,
    );
  }

  textLines.push(
    `Add a subtle drop shadow or outer glow behind the text to guarantee readability over any background.`,
  );

  const prompt = [
    `Create a professional YouTube thumbnail for a church sermon titled "${title}".`,
    ``,
    `BACKGROUND DESIGN:`,
    `Color palette: ${palette}.`,
    `Texture: ${element}.`,
    `Layout: The colors are ${composition}.`,
    `The background should look like a soft, artistic, hand-painted canvas — muted and elegant, NOT flashy, neon, or digitally sharp.`,
    `Think fine art texture, subtle color transitions, and a calm painterly elegance. No geometric shapes, no bokeh, no glowing effects.`,
    ``,
    ...textLines,
    ``,
    `CONSTRAINTS:`,
    `Do NOT include any people, human figures, or faces.`,
    `Do NOT use bright neon colors, sharp geometric shapes, or high-contrast digital effects.`,
    `Professional church media style. 16:9 aspect ratio.`,
  ].join("\n");

  return { prompt, combo };
}

/** Decode an OpenAI image response and resize to 1280x720 JPEG */
async function decodeAndResize(response: { data?: Array<{ b64_json?: string; url?: string }> }): Promise<Buffer> {
  const imageData = response.data?.[0];
  if (!imageData) {
    throw new Error("No image returned from OpenAI");
  }

  let imageBuffer: Buffer;
  if (imageData.b64_json) {
    imageBuffer = Buffer.from(imageData.b64_json, "base64");
  } else if (imageData.url) {
    const imgResponse = await fetch(imageData.url);
    if (!imgResponse.ok) {
      throw new Error(`Failed to fetch generated image: ${imgResponse.status}`);
    }
    imageBuffer = Buffer.from(await imgResponse.arrayBuffer());
  } else {
    throw new Error("Unexpected response format from OpenAI");
  }

  return sharp(imageBuffer)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();
}

/**
 * Mode 1: Pastor + Title — fully programmatic (no AI).
 * Composites: gradient background + texture overlay + title text + uploaded pastor PNG.
 */
export async function generatePastorTitleProgrammatic(
  pastorImageUrl: string,
  title: string,
  layout: PastorLayout
): Promise<Buffer> {
  const width = THUMB_WIDTH;
  const height = THUMB_HEIGHT;

  const { paletteIdx, textureIdx } = pickProgrammaticCombo();
  const palette = GRADIENT_PALETTES[paletteIdx];
  const textureType = TEXTURE_TYPES[textureIdx];
  const textureOpacity = 0.10 + Math.random() * 0.10;

  console.log(`[ThumbnailGen] === PASTOR-TITLE-PROGRAMMATIC ===`);
  console.log(`[ThumbnailGen] Title: "${title}" | Layout: ${layout}`);
  console.log(`[ThumbnailGen] Palette: ${palette.name} | Texture: ${textureType} (${(textureOpacity * 100).toFixed(0)}%)`);

  const startTime = Date.now();

  // Generate all layers in parallel
  const [gradientLayer, textureLayer, titleLayer, pastorLayer] = await Promise.all([
    createGradientLayer(width, height, palette, layout),
    createTextureLayer(width, height, textureType, textureOpacity),
    createTitleLayer(width, height, title, layout),
    fetchAndPrepPastor(pastorImageUrl, width, height, layout),
  ]);

  // Composite: gradient (base) + texture (soft-light) + title (over) + pastor (over)
  const result = await sharp(gradientLayer)
    .composite([
      { input: textureLayer, blend: "soft-light" as any },
      { input: titleLayer, blend: "over" },
      { input: pastorLayer, blend: "over" },
    ])
    .jpeg({ quality: 90 })
    .toBuffer();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ThumbnailGen] Programmatic pastor-title done in ${elapsed}s (${result.length} bytes)`);

  return result;
}

/**
 * Mode 2: Title + Service Overlay — snapshot as backdrop with big centered title.
 * Uses images.edit() with snapshot only (no style refs).
 */
export async function generateServiceOverlay(
  snapshotBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  console.log(`[ThumbnailGen] === SERVICE-OVERLAY REQUEST ===`);
  console.log(`[ThumbnailGen] Title: "${title}"`);
  console.log(`[ThumbnailGen] Input snapshot buffer: ${snapshotBuffer.length} bytes`);
  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  console.log(`[ThumbnailGen] Converted snapshot PNG: ${snapshotPng.length} bytes`);
  const snapshotFile = new File([snapshotPng], "snapshot.png", { type: "image/png" });
  console.log(`[ThumbnailGen] Snapshot file: name=${snapshotFile.name}, size=${snapshotFile.size} bytes, type=${snapshotFile.type}`);

  const prompt = buildServiceOverlayPrompt(title);
  console.log(`[ThumbnailGen] FULL PROMPT:\n${prompt}`);
  console.log(`[ThumbnailGen] Calling openai.images.edit() with model=gpt-image-1, size=1536x1024`);

  const startTime = Date.now();
  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: [snapshotFile] as any,
    prompt,
    size: "1536x1024",
  } as any);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[ThumbnailGen] === SERVICE-OVERLAY RESPONSE (${elapsed}s) ===`);
  console.log(`[ThumbnailGen] Response data items: ${response.data?.length ?? 0}`);
  if (response.data?.[0]) {
    const d: any = response.data[0];
    console.log(`[ThumbnailGen] Has b64_json: ${!!d.b64_json} (${d.b64_json ? d.b64_json.length : 0} chars)`);
    console.log(`[ThumbnailGen] Has url: ${!!d.url}`);
  }

  return decodeAndResize(response);
}

/**
 * Mode 3: Title + Colored Background — AI generates vibrant background with centered title.
 * Uses images.generate() only (no snapshot, no style refs).
 */
export async function generateTitleColoredBg(
  title: string,
  subtitle?: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const { prompt, combo } = buildTitleColoredBgPrompt(title, subtitle);
  console.log("[ThumbnailGen] === TITLE-COLORED-BG REQUEST ===");
  console.log("[ThumbnailGen] Title:", title, "Subtitle:", subtitle || "(none)");
  console.log("[ThumbnailGen] Combo:", JSON.stringify(combo));
  console.log("[ThumbnailGen] FULL PROMPT:\n" + prompt);
  console.log("[ThumbnailGen] Calling openai.images.generate() with model=gpt-image-1, size=1536x1024");

  const startTime = Date.now();
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1536x1024",
  });
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[ThumbnailGen] === TITLE-COLORED-BG RESPONSE (${elapsed}s) ===`);
  console.log(`[ThumbnailGen] Response data items: ${response.data?.length ?? 0}`);
  if (response.data?.[0]) {
    const d: any = response.data[0];
    console.log(`[ThumbnailGen] Has b64_json: ${!!d.b64_json} (${d.b64_json ? d.b64_json.length : 0} chars)`);
    console.log(`[ThumbnailGen] Has url: ${!!d.url}`);
  }

  return decodeAndResize(response);
}
