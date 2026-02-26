import OpenAI from "openai";
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

import { storage } from "./storage";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Install bundled fonts into ~/.fonts so fontconfig picks them up
(function installFonts() {
  const fontsDir = path.join(__dirname, "fonts");
  const destDir = path.join(process.env.HOME || "/home/runner", ".fonts");
  try {
    if (!fs.existsSync(fontsDir)) return;
    fs.mkdirSync(destDir, { recursive: true });
    for (const f of fs.readdirSync(fontsDir)) {
      const src = path.join(fontsDir, f);
      const dst = path.join(destDir, f);
      if (!fs.existsSync(dst)) fs.copyFileSync(src, dst);
    }
    execSync("fc-cache -f", { stdio: "ignore" });
    console.log("[Fonts] Installed bundled fonts");
  } catch (e: any) {
    console.warn("[Fonts] Could not install fonts:", e.message);
  }
})();

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
  // 10 new visually distinct palettes
  { name: "warm-peach-salmon",    dark: { r: 45,  g: 20,  b: 15  }, mid: { r: 200, g: 110, b: 80  }, light: { r: 255, g: 180, b: 140 }, accent: { r: 255, g: 220, b: 200 } },
  { name: "bright-fuchsia",       dark: { r: 40,  g: 5,   b: 35  }, mid: { r: 160, g: 20,  b: 120 }, light: { r: 240, g: 60,  b: 180 }, accent: { r: 255, g: 150, b: 220 } },
  { name: "forest-olive",         dark: { r: 15,  g: 25,  b: 10  }, mid: { r: 50,  g: 80,  b: 30  }, light: { r: 100, g: 140, b: 50  }, accent: { r: 180, g: 220, b: 100 } },
  { name: "dusty-rose-mauve",     dark: { r: 35,  g: 15,  b: 25  }, mid: { r: 140, g: 70,  b: 100 }, light: { r: 200, g: 130, b: 160 }, accent: { r: 240, g: 190, b: 210 } },
  { name: "charcoal-slate",       dark: { r: 15,  g: 18,  b: 20  }, mid: { r: 55,  g: 65,  b: 75  }, light: { r: 110, g: 125, b: 140 }, accent: { r: 180, g: 195, b: 210 } },
  { name: "deep-burgundy-wine",   dark: { r: 30,  g: 5,   b: 10  }, mid: { r: 100, g: 15,  b: 30  }, light: { r: 160, g: 40,  b: 60  }, accent: { r: 220, g: 120, b: 140 } },
  { name: "tropical-teal-yellow", dark: { r: 5,   g: 30,  b: 30  }, mid: { r: 20,  g: 120, b: 110 }, light: { r: 80,  g: 200, b: 170 }, accent: { r: 240, g: 230, b: 100 } },
  { name: "lavender-violet",      dark: { r: 20,  g: 12,  b: 40  }, mid: { r: 100, g: 70,  b: 160 }, light: { r: 170, g: 140, b: 220 }, accent: { r: 220, g: 200, b: 255 } },
  { name: "rust-terracotta",      dark: { r: 35,  g: 15,  b: 8   }, mid: { r: 160, g: 70,  b: 30  }, light: { r: 210, g: 120, b: 60  }, accent: { r: 240, g: 180, b: 120 } },
  { name: "ice-blue-arctic",      dark: { r: 10,  g: 20,  b: 35  }, mid: { r: 60,  g: 120, b: 180 }, light: { r: 150, g: 200, b: 240 }, accent: { r: 220, g: 240, b: 255 } },
];

type TextureType = "grain" | "waves" | "checkers" | "diagonal-lines" | "dots";
const TEXTURE_TYPES: TextureType[] = ["grain", "waves", "checkers", "diagonal-lines", "dots"];

// Text style variations for programmatic pastor-title thumbnails
interface TextStyle {
  name: string;
  color: string;        // Pango foreground color
  fontFamily: string;   // Pango font family
}

const TEXT_STYLES: TextStyle[] = [
  { name: "montserrat",   color: "white", fontFamily: "Montserrat Bold" },
  { name: "bebas",        color: "white", fontFamily: "Bebas Neue" },
  { name: "oswald",       color: "white", fontFamily: "Oswald Bold" },
  { name: "anton",        color: "white", fontFamily: "Anton" },
  { name: "poppins",      color: "white", fontFamily: "Poppins Bold" },
  { name: "playfair",     color: "white", fontFamily: "Playfair Display Bold" },
  { name: "raleway",      color: "white", fontFamily: "Raleway Bold" },
  { name: "dejavu-sans",  color: "white", fontFamily: "DejaVu Sans Bold" },
  { name: "dejavu-serif", color: "white", fontFamily: "DejaVu Serif Bold" },
];

// Anti-repeat for programmatic pastor-title
const recentProgrammaticCombos: Array<[number, number, number]> = [];
const PROGRAMMATIC_HISTORY_SIZE = 8;

function pickProgrammaticCombo(): { paletteIdx: number; textureIdx: number; styleIdx: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
      textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
      styleIdx: Math.floor(Math.random() * TEXT_STYLES.length),
    };
    const tooSimilar = recentProgrammaticCombos.some(
      ([p, t, s]) => {
        let m = 0;
        if (p === c.paletteIdx) m++;
        if (t === c.textureIdx) m++;
        if (s === c.styleIdx) m++;
        return m >= 2;
      }
    );
    if (!tooSimilar) {
      recentProgrammaticCombos.push([c.paletteIdx, c.textureIdx, c.styleIdx]);
      if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
      return c;
    }
  }
  const f = {
    paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
    textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
    styleIdx: Math.floor(Math.random() * TEXT_STYLES.length),
  };
  recentProgrammaticCombos.push([f.paletteIdx, f.textureIdx, f.styleIdx]);
  if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
  return f;
}

interface ColorBlob {
  cx: number; cy: number;  // 0-1 normalized
  radius: number;          // 0.3-0.7
  color: RGBColor;
}

async function createGradientLayer(
  width: number, height: number, palette: GradientPalette, layout: PastorLayout
): Promise<Buffer> {
  const qw = Math.max(1, Math.round(width / 4));
  const qh = Math.max(1, Math.round(height / 4));
  const buf = Buffer.alloc(qw * qh * 3);

  // --- Pass 1: Painterly multi-blob base ---
  const colors = [palette.dark, palette.mid, palette.light, palette.accent];
  const blobs: ColorBlob[] = [];
  for (let i = 0; i < 6; i++) {
    blobs.push({
      cx: Math.random(),
      cy: Math.random(),
      radius: 0.3 + Math.random() * 0.4,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }

  // Text side darkening direction
  const darkSide = layout === "right" ? 0.0 : 1.0;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / qw;
      const ny = y / qh;

      // Weighted blend of all blobs by gaussian falloff
      let totalWeight = 0;
      let r = 0, g = 0, b = 0;
      for (const blob of blobs) {
        const dx = nx - blob.cx;
        const dy = ny - blob.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const weight = Math.exp(-(dist * dist) / (2 * blob.radius * blob.radius));
        r += blob.color.r * weight;
        g += blob.color.g * weight;
        b += blob.color.b * weight;
        totalWeight += weight;
      }
      r /= totalWeight;
      g /= totalWeight;
      b /= totalWeight;

      // --- Pass 2: Directional light/dark overlay ---
      // Darken text side (0.5), brighten pastor side (1.0)
      const brightnessFactor = 0.5 + 0.5 * (darkSide === 0.0 ? nx : 1 - nx);
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;

      // Vignette — subtle edge darkening for cinematic feel
      const vdx = nx - 0.5;
      const vdy = (ny - 0.5) * 0.75;
      const vDist = Math.sqrt(vdx * vdx + vdy * vdy);
      const vignette = Math.max(0.3, 1.0 - vDist * 1.0);
      r *= vignette;
      g *= vignette;
      b *= vignette;

      const idx = (y * qw + x) * 3;
      buf[idx] = Math.round(Math.min(255, Math.max(0, r)));
      buf[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
      buf[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
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
  const opacityScale = (textureType === "checkers" || textureType === "diagonal-lines" || textureType === "dots")
    ? 0.4
    : 1.0;
  const alpha = Math.round(opacity * opacityScale * 255);

  // Hoist any per-call randomness outside the loop
  const waveFreq = 0.015 + Math.random() * 0.015;
  const wavePhase = Math.random() * Math.PI * 2;
  const checkerSize = 30 + Math.floor(Math.random() * 31);   // 30-60
  const lineSpacing = 20 + Math.floor(Math.random() * 21);   // 20-40
  const dotSpacing = 35 + Math.floor(Math.random() * 31);    // 35-65
  const dotHalf = Math.floor(dotSpacing / 2);

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
          const cx = Math.floor(x / checkerSize);
          const cy = Math.floor(y / checkerSize);
          v = (cx + cy) % 2 === 0 ? 200 : 60;
          break;
        }
        case "diagonal-lines": {
          const diag = (x + y) % lineSpacing;
          v = diag < 4 ? 220 : 40;
          break;
        }
        case "dots": {
          const dx = (x % dotSpacing) - dotHalf;
          const dy = (y % dotSpacing) - dotHalf;
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
  width: number, height: number, title: string, layout: PastorLayout,
  style: TextStyle, subtitle?: string
): Promise<Buffer> {
  const textZoneWidth = Math.round(width * 0.45);
  const words = title.trim().split(/\s+/);
  const wordCount = words.length;
  let fontSize: number;
  if (wordCount <= 2) fontSize = Math.round(height * 0.18);
  else if (wordCount <= 4) fontSize = Math.round(height * 0.14);
  else fontSize = Math.round(height * 0.10);

  // Scale down if the longest word is too wide for the text zone
  const longestWord = words.reduce((a, b) => a.length > b.length ? a : b, "");
  const estCharWidth = fontSize * 0.65; // approximate uppercase character width
  const estWordWidth = longestWord.length * estCharWidth;
  if (estWordWidth > textZoneWidth * 0.9) {
    fontSize = Math.round((textZoneWidth * 0.9) / (longestWord.length * 0.65));
  }

  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").toUpperCase();
  const pangoMarkup = `<span foreground="${style.color}" font_desc="${style.fontFamily} ${fontSize}px">${escaped}</span>`;

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

  // Build subtitle image if provided — sized to fit on one line
  let subtitleImage: Buffer | null = null;
  let subtitleW = 0;
  let subtitleH = 0;
  if (subtitle && subtitle.trim()) {
    let subFontSize = Math.round(fontSize * 0.3);
    // Estimate if subtitle fits on one line; shrink if needed
    const estSubWidth = subtitle.length * subFontSize * 0.55;
    if (estSubWidth > textZoneWidth * 0.95) {
      subFontSize = Math.round((textZoneWidth * 0.95) / (subtitle.length * 0.55));
    }
    const escapedSub = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const subMarkup = `<span foreground="${style.color}" font_desc="DejaVu Sans ${subFontSize}px">${escapedSub}</span>`;
    subtitleImage = await sharp({
      text: {
        text: subMarkup,
        rgba: true,
        width: textZoneWidth,
        align: "centre",
        justify: false,
        dpi: 72,
      },
    }).png().toBuffer();
    const subMeta = await sharp(subtitleImage).metadata();
    subtitleW = subMeta.width!;
    subtitleH = subMeta.height!;
  }

  // Total height of title + gap + subtitle
  const gap = subtitle ? Math.round(fontSize * 0.25) : 0;
  const totalTextH = textH + gap + subtitleH;

  // Center text block in the text zone (opposite side from pastor)
  const textZoneX = layout === "right" ? width * 0.05 : width * 0.50;
  const left = Math.round(textZoneX + (textZoneWidth - textW) / 2);
  const top = Math.round((height - totalTextH) / 2);

  // Create hard drop shadow for title (no blur)
  // Use recomb to zero out RGB channels (tint preserves luminance so white stays white)
  const shadowOffset = 2;
  const shadowImage = await sharp(textImage)
    .ensureAlpha()
    .recomb([[0,0,0],[0,0,0],[0,0,0]])
    .toBuffer();

  const composites: sharp.OverlayOptions[] = [
    { input: shadowImage, left: Math.max(0, left + shadowOffset), top: Math.max(0, top + shadowOffset), blend: "over" },
    { input: textImage, left: Math.max(0, left), top: Math.max(0, top), blend: "over" },
  ];

  // Add subtitle and its shadow if present
  if (subtitleImage) {
    const subLeft = Math.round(textZoneX + (textZoneWidth - subtitleW) / 2);
    const subTop = top + textH + gap;

    const subShadow = await sharp(subtitleImage)
      .ensureAlpha()
      .recomb([[0,0,0],[0,0,0],[0,0,0]])
      .toBuffer();

    composites.push(
      { input: subShadow, left: Math.max(0, subLeft + shadowOffset), top: Math.max(0, subTop + shadowOffset), blend: "over" },
      { input: subtitleImage, left: Math.max(0, subLeft), top: Math.max(0, subTop), blend: "over" },
    );
  }

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function fetchAndPrepPastor(
  pastorImageUrl: string, width: number, height: number,
  layout: PastorLayout, palette: GradientPalette
): Promise<Buffer> {
  const response = await fetch(pastorImageUrl);
  if (!response.ok) throw new Error(`Failed to fetch pastor image: ${response.status}`);
  const pastorBuffer = Buffer.from(await response.arrayBuffer());

  const meta = await sharp(pastorBuffer).metadata();
  const origW = meta.width!;
  const origH = meta.height!;

  // Scale to fit pastor zone (~40% width) maintaining aspect ratio
  const zoneWidth = Math.round(width * 0.40);
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

  // Shadow: black copy, blurred, offset down-right
  // Use recomb to zero out RGB (tint preserves luminance)
  const shadowLayer = await sharp(scaledPastor)
    .ensureAlpha()
    .recomb([[0,0,0],[0,0,0],[0,0,0]])
    .blur(8)
    .toBuffer();

  // Glow: accent-colored copy, blurred wider, for subtle rim light
  const glowLayer = await sharp(scaledPastor)
    .ensureAlpha()
    .tint(palette.accent)
    .blur(12)
    .toBuffer();

  // Composite onto full-size canvas: glow → shadow → pastor
  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([
      { input: glowLayer, left: Math.max(0, left), top: Math.max(0, top), blend: "over" },
      { input: shadowLayer, left: Math.max(0, left + 6), top: Math.max(0, top + 6), blend: "over" },
      { input: scaledPastor, left: Math.max(0, left), top: Math.max(0, top), blend: "over" },
    ])
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
  layout: PastorLayout,
  subtitle?: string
): Promise<Buffer> {
  const width = THUMB_WIDTH;
  const height = THUMB_HEIGHT;

  const { paletteIdx, textureIdx, styleIdx } = pickProgrammaticCombo();
  const palette = GRADIENT_PALETTES[paletteIdx];
  const textureType = TEXTURE_TYPES[textureIdx];
  const textStyle = TEXT_STYLES[styleIdx];
  const textureOpacity = 0.15 + Math.random() * 0.15;

  console.log(`[ThumbnailGen] === PASTOR-TITLE-PROGRAMMATIC ===`);
  console.log(`[ThumbnailGen] Title: "${title}" | Subtitle: "${subtitle || "(none)"}" | Layout: ${layout}`);
  console.log(`[ThumbnailGen] Palette: ${palette.name} | Texture: ${textureType} (${(textureOpacity * 100).toFixed(0)}%) | Text style: ${textStyle.name}`);

  const startTime = Date.now();

  // Generate all layers in parallel
  const [gradientLayer, textureLayer, titleLayer, pastorLayer] = await Promise.all([
    createGradientLayer(width, height, palette, layout),
    createTextureLayer(width, height, textureType, textureOpacity),
    createTitleLayer(width, height, title, layout, textStyle, subtitle),
    fetchAndPrepPastor(pastorImageUrl, width, height, layout, palette),
  ]);

  // Composite: gradient (base) + texture (soft-light) + title (over) + pastor (over)
  const result = await sharp(gradientLayer)
    .composite([
      { input: textureLayer, blend: "overlay" as any },
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
