import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

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
  // Light palettes (for 3D extruded text and variety)
  { name: "light-sky-blue",       dark: { r: 100, g: 140, b: 180 }, mid: { r: 150, g: 195, b: 230 }, light: { r: 200, g: 225, b: 245 }, accent: { r: 60,  g: 120, b: 200 } },
  { name: "light-warm-cream",     dark: { r: 170, g: 140, b: 100 }, mid: { r: 210, g: 190, b: 155 }, light: { r: 240, g: 230, b: 210 }, accent: { r: 180, g: 120, b: 60  } },
  { name: "light-sage-mint",      dark: { r: 110, g: 150, b: 120 }, mid: { r: 155, g: 200, b: 170 }, light: { r: 200, g: 235, b: 210 }, accent: { r: 60,  g: 140, b: 90  } },
  { name: "light-lavender",       dark: { r: 130, g: 115, b: 170 }, mid: { r: 175, g: 160, b: 215 }, light: { r: 215, g: 205, b: 240 }, accent: { r: 100, g: 70,  b: 180 } },
  { name: "light-peach-coral",    dark: { r: 190, g: 130, b: 110 }, mid: { r: 225, g: 175, b: 155 }, light: { r: 245, g: 215, b: 200 }, accent: { r: 200, g: 90,  b: 60  } },
  { name: "light-golden-sand",    dark: { r: 170, g: 155, b: 110 }, mid: { r: 215, g: 200, b: 155 }, light: { r: 240, g: 235, b: 200 }, accent: { r: 180, g: 140, b: 40  } },
];

type TextureType = "grain" | "waves" | "checkers" | "diagonal-lines" | "dots" | "concentric" | "halftone" | "crosshatch";
const TEXTURE_TYPES: TextureType[] = ["grain", "waves", "checkers", "diagonal-lines", "dots", "concentric", "halftone", "crosshatch"];

type GradientStrategy = "blobs" | "bands" | "spotlights" | "noise" | "mesh";
const GRADIENT_STRATEGIES: GradientStrategy[] = ["blobs", "bands", "spotlights", "noise", "mesh"];

// Text style variations for programmatic pastor-title thumbnails
interface TextStyle {
  name: string;
  color: string;              // Pango foreground color
  fontFamily: string;         // Title font (Pango font family)
  subtitleFontFamily: string; // Subtitle font (paired)
}

export const TEXT_STYLES: TextStyle[] = [
  // --- Original curated pairings ---
  { name: "bebas-montserrat",       color: "white", fontFamily: "Bebas Neue",               subtitleFontFamily: "Montserrat" },
  { name: "anton-poppins",          color: "white", fontFamily: "Anton",                    subtitleFontFamily: "Poppins Bold" },
  { name: "oswald-raleway",         color: "white", fontFamily: "Oswald Bold",              subtitleFontFamily: "Raleway" },
  { name: "montserrat-black",       color: "white", fontFamily: "Montserrat Black",         subtitleFontFamily: "Montserrat Light" },
  { name: "playfair-montserrat",    color: "white", fontFamily: "Playfair Display Bold",    subtitleFontFamily: "Montserrat" },
  { name: "raleway-black-oswald",   color: "white", fontFamily: "Raleway Black",            subtitleFontFamily: "Oswald Light" },
  { name: "oswald-light-dejavu",    color: "white", fontFamily: "Oswald Light",             subtitleFontFamily: "DejaVu Sans" },
  { name: "playfair-raleway",       color: "white", fontFamily: "Playfair Display Medium",  subtitleFontFamily: "Raleway Light" },
  { name: "poppins-raleway",        color: "white", fontFamily: "Poppins Bold",             subtitleFontFamily: "Raleway" },
  { name: "montserrat-playfair",    color: "white", fontFamily: "Montserrat Bold",          subtitleFontFamily: "Playfair Display" },
  { name: "dejavu-serif-sans",      color: "white", fontFamily: "DejaVu Serif Bold",        subtitleFontFamily: "DejaVu Sans" },
  { name: "raleway-light-poppins",  color: "white", fontFamily: "Raleway Light",            subtitleFontFamily: "Poppins Bold" },
  // --- User-requested pairings (Left Column) ---
  { name: "playfair-montserrat2",   color: "white", fontFamily: "Playfair Display",         subtitleFontFamily: "Montserrat" },
  { name: "robotoslab-opensans",    color: "white", fontFamily: "Roboto Slab Bold",         subtitleFontFamily: "Open Sans" },
  { name: "righteous-dancingscript", color: "white", fontFamily: "Righteous",               subtitleFontFamily: "Dancing Script" },
  { name: "cormorant-raleway",      color: "white", fontFamily: "Cormorant Garamond Bold",  subtitleFontFamily: "Raleway" },
  { name: "lato-oswald",            color: "white", fontFamily: "Lato Bold",                subtitleFontFamily: "Oswald" },
  { name: "sourceserif-sourcesans", color: "white", fontFamily: "Source Serif Pro Bold",    subtitleFontFamily: "Source Sans Pro" },
  { name: "josefinslab-lora",       color: "white", fontFamily: "Josefin Slab Bold",        subtitleFontFamily: "Lora" },
  { name: "librebaskerville-caveat", color: "white", fontFamily: "Libre Baskerville Bold",  subtitleFontFamily: "Caveat" },
  { name: "abril-worksans",         color: "white", fontFamily: "Abril Fatface",            subtitleFontFamily: "Work Sans" },
  { name: "oswald-ptsans",          color: "white", fontFamily: "Oswald Bold",              subtitleFontFamily: "PT Sans" },
  { name: "alfaslab-quicksand",     color: "white", fontFamily: "Alfa Slab One",            subtitleFontFamily: "Quicksand Light" },
  { name: "archivoblack-nunito",    color: "white", fontFamily: "Archivo Black",            subtitleFontFamily: "Nunito" },
  // --- User-requested pairings (Middle Column) ---
  { name: "librebodoni-alexbrush",  color: "white", fontFamily: "Libre Bodoni Bold",        subtitleFontFamily: "Alex Brush" },
  { name: "merriweather-poppins",   color: "white", fontFamily: "Merriweather Bold",        subtitleFontFamily: "Poppins Bold" },
  { name: "ebgaramond-sacramento",  color: "white", fontFamily: "EB Garamond Bold",         subtitleFontFamily: "Sacramento" },
  { name: "cinzel-josefinsans",     color: "white", fontFamily: "Cinzel Bold",              subtitleFontFamily: "Josefin Sans" },
  { name: "bebas-roboto",           color: "white", fontFamily: "Bebas Neue",               subtitleFontFamily: "Roboto" },
  { name: "pacifico-quicksand",     color: "white", fontFamily: "Pacifico",                 subtitleFontFamily: "Quicksand" },
  { name: "amatic-ubuntu",          color: "white", fontFamily: "Amatic SC Bold",           subtitleFontFamily: "Ubuntu" },
  { name: "dmserif-poppins",        color: "white", fontFamily: "DM Serif Display",         subtitleFontFamily: "Poppins Bold" },
  { name: "bungee-yanonekaffee",    color: "white", fontFamily: "Bungee",                   subtitleFontFamily: "Yanone Kaffeesatz" },
  { name: "arvo-robotoslab",        color: "white", fontFamily: "Arvo Bold",                subtitleFontFamily: "Roboto Slab Light" },
  { name: "spectral-greatvibes",    color: "white", fontFamily: "Spectral Bold",            subtitleFontFamily: "Great Vibes" },
  // --- User-requested pairings (Right Column) ---
  { name: "crimsonpro-opensans",    color: "white", fontFamily: "Crimson Pro Bold",         subtitleFontFamily: "Open Sans Light" },
  { name: "fredoka-kalam",          color: "white", fontFamily: "Fredoka Bold",             subtitleFontFamily: "Kalam" },
  { name: "dancingscript-caveat",   color: "white", fontFamily: "Dancing Script Bold",      subtitleFontFamily: "Caveat" },
  { name: "outfit-opensans",        color: "white", fontFamily: "Outfit Bold",              subtitleFontFamily: "Open Sans" },
  { name: "kaushanscript-crimson",  color: "white", fontFamily: "Kaushan Script",           subtitleFontFamily: "Crimson Text" },
  { name: "specialelite-tenor",     color: "white", fontFamily: "Special Elite",            subtitleFontFamily: "Tenor Sans" },
  { name: "cardo-spacegrotesk",     color: "white", fontFamily: "Cardo Bold",               subtitleFontFamily: "Space Grotesk" },
  { name: "yellowtail-karla",       color: "white", fontFamily: "Yellowtail",               subtitleFontFamily: "Karla" },
  { name: "fugazone-inter",         color: "white", fontFamily: "Fugaz One",                subtitleFontFamily: "Inter" },
  { name: "comfortaa-notoserif",    color: "white", fontFamily: "Comfortaa Bold",           subtitleFontFamily: "Noto Serif Display" },
  { name: "titillium-opensans",     color: "white", fontFamily: "Titillium Web Bold",       subtitleFontFamily: "Open Sans" },
  { name: "lilita-barlow",          color: "white", fontFamily: "Lilita One",               subtitleFontFamily: "Barlow" },
];

// Anti-repeat for programmatic pastor-title
const recentProgrammaticCombos: Array<[number, number, number, number]> = [];
const PROGRAMMATIC_HISTORY_SIZE = 12;

function pickProgrammaticCombo(): { paletteIdx: number; textureIdx: number; styleIdx: number; strategyIdx: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
      textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
      styleIdx: Math.floor(Math.random() * TEXT_STYLES.length),
      strategyIdx: Math.floor(Math.random() * GRADIENT_STRATEGIES.length),
    };
    // Reject if 2+ of 4 axes match any combo in the full history
    const tooSimilar = recentProgrammaticCombos.some(
      ([p, t, s, g]) => {
        let m = 0;
        if (p === c.paletteIdx) m++;
        if (t === c.textureIdx) m++;
        if (s === c.styleIdx) m++;
        if (g === c.strategyIdx) m++;
        return m >= 2;
      }
    );
    if (!tooSimilar) {
      recentProgrammaticCombos.push([c.paletteIdx, c.textureIdx, c.styleIdx, c.strategyIdx]);
      if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
      return c;
    }
  }
  const f = {
    paletteIdx: Math.floor(Math.random() * GRADIENT_PALETTES.length),
    textureIdx: Math.floor(Math.random() * TEXTURE_TYPES.length),
    styleIdx: Math.floor(Math.random() * TEXT_STYLES.length),
    strategyIdx: Math.floor(Math.random() * GRADIENT_STRATEGIES.length),
  };
  recentProgrammaticCombos.push([f.paletteIdx, f.textureIdx, f.styleIdx, f.strategyIdx]);
  if (recentProgrammaticCombos.length > PROGRAMMATIC_HISTORY_SIZE) recentProgrammaticCombos.shift();
  return f;
}

// --- Minimal 2D simplex noise (public-domain algorithm) ---
function createSimplexNoise(): (x: number, y: number) => number {
  // Build a shuffled permutation table seeded by Math.random()
  const perm = new Uint8Array(512);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];

  const grad2 = [[1,1],[-1,1],[1,-1],[-1,-1],[1,0],[-1,0],[0,1],[0,-1]];
  const F2 = 0.5 * (Math.sqrt(3) - 1);
  const G2 = (3 - Math.sqrt(3)) / 6;

  return (x: number, y: number): number => {
    const s = (x + y) * F2;
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t, Y0 = j - t;
    const x0 = x - X0, y0 = y - Y0;

    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
    const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;

    const ii = i & 255, jj = j & 255;

    let n0 = 0, n1 = 0, n2 = 0;
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) { t0 *= t0; const g = grad2[perm[ii + perm[jj]] % 8]; n0 = t0 * t0 * (g[0] * x0 + g[1] * y0); }
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) { t1 *= t1; const g = grad2[perm[ii + i1 + perm[jj + j1]] % 8]; n1 = t1 * t1 * (g[0] * x1 + g[1] * y1); }
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) { t2 *= t2; const g = grad2[perm[ii + 1 + perm[jj + 1]] % 8]; n2 = t2 * t2 * (g[0] * x2 + g[1] * y2); }

    // Return value in 0-1 range
    return (70 * (n0 + n1 + n2) + 1) * 0.5;
  };
}

interface ColorBlob {
  cx: number; cy: number;  // 0-1 normalized
  radius: number;          // 0.3-0.7
  color: RGBColor;
}

async function createGradientLayer(
  width: number, height: number, palette: GradientPalette,
  layout: PastorLayout | "center", strategy: GradientStrategy
): Promise<Buffer> {
  const qw = Math.max(1, Math.round(width / 4));
  const qh = Math.max(1, Math.round(height / 4));
  const buf = Buffer.alloc(qw * qh * 3);

  const colors = [palette.dark, palette.mid, palette.light, palette.accent];

  // --- Pre-compute strategy-specific data outside pixel loop ---

  // Blobs
  let blobs: ColorBlob[] = [];
  if (strategy === "blobs") {
    const blobCount = 4 + Math.floor(Math.random() * 5);
    for (let i = 0; i < blobCount; i++) {
      blobs.push({
        cx: Math.random(), cy: Math.random(),
        radius: 0.3 + Math.random() * 0.4,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  // Bands
  let bandColors: RGBColor[] = [];
  let bandAngle = 0;
  let bandOverlap = 0;
  if (strategy === "bands") {
    const bandCount = 3 + Math.floor(Math.random() * 3); // 3-5
    for (let i = 0; i < bandCount; i++) {
      bandColors.push(colors[Math.floor(Math.random() * colors.length)]);
    }
    bandAngle = Math.random() * Math.PI; // 0-180°
    bandOverlap = 0.15 + Math.random() * 0.10; // 15-25% of band width
  }

  // Spotlights
  interface Spotlight { cx: number; cy: number; radius: number; color: RGBColor }
  let spotlights: Spotlight[] = [];
  if (strategy === "spotlights") {
    const count = 2 + Math.floor(Math.random() * 3); // 2-4
    for (let i = 0; i < count; i++) {
      spotlights.push({
        cx: Math.random(), cy: Math.random(),
        radius: 0.3 + Math.random() * 0.3, // 0.3-0.6
        color: colors[1 + Math.floor(Math.random() * 3)], // mid/light/accent
      });
    }
  }

  // Noise
  let noiseFn: ((x: number, y: number) => number) | null = null;
  let noiseScale = 0;
  let noiseOffX = 0;
  let noiseOffY = 0;
  if (strategy === "noise") {
    noiseFn = createSimplexNoise();
    noiseScale = 0.002 + Math.random() * 0.004; // 0.002-0.006
    noiseOffX = Math.random() * 10000;
    noiseOffY = Math.random() * 10000;
  }

  // Mesh
  interface MeshPoint { px: number; py: number; color: RGBColor }
  let meshGrid: MeshPoint[][] = [];
  if (strategy === "mesh") {
    for (let row = 0; row < 3; row++) {
      meshGrid[row] = [];
      for (let col = 0; col < 3; col++) {
        // Base position: evenly spaced, jittered ±10%
        const px = (col / 2) + (Math.random() - 0.5) * 0.1;
        const py = (row / 2) + (Math.random() - 0.5) * 0.1;
        meshGrid[row][col] = {
          px: Math.max(0, Math.min(1, px)),
          py: Math.max(0, Math.min(1, py)),
          color: colors[Math.floor(Math.random() * colors.length)],
        };
      }
    }
  }

  // Shared: gradient direction modes
  const darkSide = layout === "center" ? 0.5 : layout === "right" ? 0.0 : 1.0;
  const darkSideFactor = 0.4 + Math.random() * 0.25;
  const lightSideFactor = 0.85 + Math.random() * 0.15;
  const gradientMode = layout === "center" ? 3 : Math.floor(Math.random() * 4); // center uses radial

  // Vignette strength: min brightness at edges (0.6–1.0 → 0–40% darkening)
  const vignetteMin = 0.6 + Math.random() * 0.4;

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / qw;
      const ny = y / qh;
      let r = 0, g = 0, b = 0;

      // --- Pass 1: Strategy-specific base color ---
      switch (strategy) {
        case "blobs": {
          let totalWeight = 0;
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
          break;
        }

        case "bands": {
          // Project pixel onto band axis
          const cosA = Math.cos(bandAngle);
          const sinA = Math.sin(bandAngle);
          const proj = nx * cosA + ny * sinA;
          // Normalize projection to 0-1 range
          const maxProj = Math.abs(cosA) + Math.abs(sinA);
          const normProj = Math.max(0, Math.min(1, proj / maxProj));

          const bandWidth = 1.0 / bandColors.length;
          const bandIdx = Math.min(bandColors.length - 1, Math.floor(normProj / bandWidth));
          const bandCenter = (bandIdx + 0.5) * bandWidth;
          const distFromCenter = Math.abs(normProj - bandCenter);
          const halfBand = bandWidth / 2;

          if (distFromCenter > halfBand * (1 - bandOverlap) && bandIdx < bandColors.length - 1) {
            // In overlap zone — cosine blend to next band
            const overlapStart = halfBand * (1 - bandOverlap);
            const blendT = (distFromCenter - overlapStart) / (halfBand * bandOverlap);
            const smoothT = 0.5 - 0.5 * Math.cos(blendT * Math.PI);
            const nextIdx = normProj > bandCenter ? Math.min(bandColors.length - 1, bandIdx + 1) : Math.max(0, bandIdx - 1);
            const c1 = bandColors[bandIdx], c2 = bandColors[nextIdx];
            r = c1.r + (c2.r - c1.r) * smoothT;
            g = c1.g + (c2.g - c1.g) * smoothT;
            b = c1.b + (c2.b - c1.b) * smoothT;
          } else {
            const c = bandColors[bandIdx];
            r = c.r; g = c.g; b = c.b;
          }
          break;
        }

        case "spotlights": {
          r = palette.dark.r; g = palette.dark.g; b = palette.dark.b;
          for (const spot of spotlights) {
            const dx = nx - spot.cx;
            const dy = ny - spot.cy;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const intensity = Math.max(0, 1 - dist / spot.radius);
            const falloff = intensity * intensity; // quadratic falloff
            r = Math.min(255, r + spot.color.r * falloff);
            g = Math.min(255, g + spot.color.g * falloff);
            b = Math.min(255, b + spot.color.b * falloff);
          }
          break;
        }

        case "noise": {
          // Fractal noise: 2-3 octaves
          const px = (x + noiseOffX) * noiseScale;
          const py = (y + noiseOffY) * noiseScale;
          let val = noiseFn!(px, py) * 1.0
                  + noiseFn!(px * 2, py * 2) * 0.5
                  + noiseFn!(px * 4, py * 4) * 0.25;
          val = Math.max(0, Math.min(1, val / 1.75)); // normalize

          // Map to palette: dark→mid→light→accent
          if (val < 0.33) {
            const t = val / 0.33;
            r = palette.dark.r + (palette.mid.r - palette.dark.r) * t;
            g = palette.dark.g + (palette.mid.g - palette.dark.g) * t;
            b = palette.dark.b + (palette.mid.b - palette.dark.b) * t;
          } else if (val < 0.66) {
            const t = (val - 0.33) / 0.33;
            r = palette.mid.r + (palette.light.r - palette.mid.r) * t;
            g = palette.mid.g + (palette.light.g - palette.mid.g) * t;
            b = palette.mid.b + (palette.light.b - palette.mid.b) * t;
          } else {
            const t = (val - 0.66) / 0.34;
            r = palette.light.r + (palette.accent.r - palette.light.r) * t;
            g = palette.light.g + (palette.accent.g - palette.light.g) * t;
            b = palette.light.b + (palette.accent.b - palette.light.b) * t;
          }
          break;
        }

        case "mesh": {
          // Find which cell this pixel falls in on the 2×2 cell grid
          const cellCol = Math.min(1, Math.floor(nx * 2));
          const cellRow = Math.min(1, Math.floor(ny * 2));
          // Local coordinates within cell (0-1)
          const lx = Math.max(0, Math.min(1, nx * 2 - cellCol));
          const ly = Math.max(0, Math.min(1, ny * 2 - cellRow));
          // Bilinear interpolation of 4 surrounding control points
          const tl = meshGrid[cellRow][cellCol].color;
          const tr = meshGrid[cellRow][cellCol + 1].color;
          const bl = meshGrid[cellRow + 1][cellCol].color;
          const br = meshGrid[cellRow + 1][cellCol + 1].color;
          const topR = tl.r + (tr.r - tl.r) * lx;
          const topG = tl.g + (tr.g - tl.g) * lx;
          const topB = tl.b + (tr.b - tl.b) * lx;
          const botR = bl.r + (br.r - bl.r) * lx;
          const botG = bl.g + (br.g - bl.g) * lx;
          const botB = bl.b + (br.b - bl.b) * lx;
          r = topR + (botR - topR) * ly;
          g = topG + (botG - topG) * ly;
          b = topB + (botB - topB) * ly;
          break;
        }
      }

      // --- Pass 2: Directional light/dark overlay (shared) ---
      let t: number;
      const baseT = darkSide === 0.0 ? nx : 1 - nx;
      switch (gradientMode) {
        case 1: // diagonal-down
          t = baseT * 0.7 + ny * 0.3;
          break;
        case 2: // diagonal-up
          t = baseT * 0.7 + (1 - ny) * 0.3;
          break;
        case 3: { // radial from text center
          const cx = layout === "center" ? 0.5 : darkSide === 0.0 ? 0.25 : 0.75;
          const dist = Math.sqrt((nx - cx) ** 2 + (ny - 0.5) ** 2);
          t = Math.min(1, dist / 0.7);
          break;
        }
        default: // horizontal
          t = baseT;
      }
      const brightnessFactor = darkSideFactor + (lightSideFactor - darkSideFactor) * t;
      r *= brightnessFactor;
      g *= brightnessFactor;
      b *= brightnessFactor;

      // Vignette — randomized edge darkening
      const vdx = nx - 0.5;
      const vdy = (ny - 0.5) * 0.75;
      const vDist = Math.sqrt(vdx * vdx + vdy * vdy);
      const vignette = Math.max(vignetteMin, 1.0 - vDist * 1.0);
      r *= vignette;
      g *= vignette;
      b *= vignette;

      const idx = (y * qw + x) * 3;
      buf[idx] = Math.round(Math.min(255, Math.max(0, r)));
      buf[idx + 1] = Math.round(Math.min(255, Math.max(0, g)));
      buf[idx + 2] = Math.round(Math.min(255, Math.max(0, b)));
    }
  }

  // Randomize blur amount: 20–60px
  const blurPx = Math.max(1, 20 + Math.floor(Math.random() * 41));

  return sharp(buf, { raw: { width: qw, height: qh, channels: 3 } })
    .resize(width, height, { fit: "fill" })
    .blur(blurPx)
    .png()
    .toBuffer();
}

async function createTextureLayer(
  width: number, height: number, textureType: TextureType, opacity: number
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height * 4);
  const opacityScale = (textureType === "checkers" || textureType === "diagonal-lines" || textureType === "dots")
    ? 0.55
    : (textureType === "concentric" || textureType === "halftone" || textureType === "crosshatch")
      ? 0.75 : 1.0;
  const alpha = Math.round(opacity * opacityScale * 255);

  // Hoist any per-call randomness outside the loop
  const waveFreq = 0.015 + Math.random() * 0.015;
  const wavePhase = Math.random() * Math.PI * 2;
  const checkerSize = 30 + Math.floor(Math.random() * 31);   // 30-60
  const lineSpacing = 20 + Math.floor(Math.random() * 21);   // 20-40
  const dotSpacing = 12 + Math.floor(Math.random() * 10);    // 12-21
  const dotHalf = Math.floor(dotSpacing / 2);

  const concentricCx = Math.random() * width;
  const concentricCy = Math.random() * height;
  const concentricFreq = 0.01 + Math.random() * 0.015;

  const halftoneSpacing = 12 + Math.floor(Math.random() * 9);
  const halftoneHalf = Math.floor(halftoneSpacing / 2);
  const halftoneMaxDot = Math.floor(halftoneSpacing * 0.45);
  const halftoneCx = width / 2;
  const halftoneCy = height / 2;
  const halftoneMaxRadius = Math.sqrt(halftoneCx ** 2 + halftoneCy ** 2);

  const crossAngle1 = 0.6 + Math.random() * 0.4;
  const crossAngle2 = 0.6 + Math.random() * 0.4;
  const crossSpacing = 15 + Math.floor(Math.random() * 16);

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
          const gx = x % checkerSize;
          const gy = y % checkerSize;
          v = (gx < 2 || gy < 2) ? 200 : 40;
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
          v = d < 3 ? 200 : 30;
          break;
        }
        case "concentric": {
          const cdx = x - concentricCx;
          const cdy = y - concentricCy;
          const dist = Math.sqrt(cdx * cdx + cdy * cdy);
          const maxDist = Math.sqrt(width * width + height * height) * 0.5;
          const decay = Math.max(0, 1 - dist / maxDist);
          const ring = Math.sin(dist * concentricFreq) * 0.5 * decay + 0.5;
          v = Math.round(ring * 255);
          break;
        }
        case "halftone": {
          const hx = (x % halftoneSpacing) - halftoneHalf;
          const hy = (y % halftoneSpacing) - halftoneHalf;
          const hDist = Math.sqrt(hx * hx + hy * hy);
          const cellCenterX = x - hx;
          const cellCenterY = y - hy;
          const distFromCenter = Math.sqrt((cellCenterX - halftoneCx) ** 2 + (cellCenterY - halftoneCy) ** 2);
          const sizeFactor = distFromCenter / halftoneMaxRadius;
          const dotRadius = halftoneMaxDot * sizeFactor;
          v = hDist < dotRadius ? 200 : 30;
          break;
        }
        case "crosshatch": {
          const line1 = Math.abs((x * crossAngle1 + y) % crossSpacing);
          const line2 = Math.abs((x * crossAngle2 - y) % crossSpacing);
          const on1 = line1 < 2;
          const on2 = line2 < 2;
          v = on1 && on2 ? 240 : on1 || on2 ? 160 : 30;
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

async function createBokehLayer(
  width: number, height: number, palette: GradientPalette, layout: PastorLayout | "center"
): Promise<Buffer> {
  const buf = Buffer.alloc(width * height * 4);

  const spotCount = 5 + Math.floor(Math.random() * 11); // 5-15
  const bokehColors = [palette.accent, palette.light, palette.mid];

  // Bias positions toward the pastor/light side (center = no bias)
  const biasX = layout === "center" ? 0.5 : layout === "right" ? 0.65 : 0.35;

  for (let i = 0; i < spotCount; i++) {
    const radius = 30 + Math.random() * 90; // 30-120
    const sigma = radius / 2;
    const sigma2 = 2 * sigma * sigma;
    const color = bokehColors[Math.floor(Math.random() * bokehColors.length)];
    const spotAlpha = 0.10 + Math.random() * 0.30; // 10-40%

    // Position biased toward the light side
    const cx = Math.round((biasX + (Math.random() - 0.5) * 0.8) * width);
    const cy = Math.round(Math.random() * height);

    // Only iterate bounding box
    const x0 = Math.max(0, Math.floor(cx - radius * 2));
    const x1 = Math.min(width - 1, Math.ceil(cx + radius * 2));
    const y0 = Math.max(0, Math.floor(cy - radius * 2));
    const y1 = Math.min(height - 1, Math.ceil(cy + radius * 2));

    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const intensity = Math.exp(-(dx * dx + dy * dy) / sigma2);
        if (intensity < 0.01) continue;

        const a = spotAlpha * intensity;
        const idx = (y * width + x) * 4;

        // Additive (screen-like) blending within the layer
        const prevR = buf[idx];
        const prevG = buf[idx + 1];
        const prevB = buf[idx + 2];
        const prevA = buf[idx + 3] / 255;

        const newR = Math.min(255, prevR + Math.round(color.r * a));
        const newG = Math.min(255, prevG + Math.round(color.g * a));
        const newB = Math.min(255, prevB + Math.round(color.b * a));
        const newA = Math.min(1, prevA + a);

        buf[idx] = newR;
        buf[idx + 1] = newG;
        buf[idx + 2] = newB;
        buf[idx + 3] = Math.round(newA * 255);
      }
    }
  }

  return sharp(buf, { raw: { width, height, channels: 4 } })
    .png()
    .toBuffer();
}

type TextAlign = "centre" | "left" | "right";

async function createTitleLayer(
  width: number, height: number, title: string, layout: PastorLayout,
  style: TextStyle, subtitle?: string,
  textAlign?: TextAlign, use3D?: boolean, colorOverride?: string
): Promise<Buffer> {
  const align: TextAlign = textAlign || (["centre", "left", "right"] as TextAlign[])[Math.floor(Math.random() * 3)];

  const textZoneWidth = Math.round(width * 0.52);
  const words = title.trim().split(/\s+/);
  const wordCount = words.length;
  let fontSize: number;
  if (wordCount <= 2) fontSize = Math.round(height * 0.45);
  else if (wordCount <= 4) fontSize = Math.round(height * 0.34);
  else fontSize = Math.round(height * 0.22);

  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").toUpperCase();
  const textColor = colorOverride || style.color;

  // Render at initial size, then shrink if text is too tall or too wide
  let textImage!: Buffer;
  const maxTextH = height * 0.68; // leave room for subtitle + church banner
  for (let attempt = 0; attempt < 8; attempt++) {
    const pangoMarkup = `<span foreground="${textColor}" font_desc="${style.fontFamily} ${fontSize}px">${escaped}</span>`;
    // Use negative spacing to tighten line height — many display fonts have excessive built-in leading
    const lineSpacing = -Math.round(fontSize * 0.25);
    textImage = await sharp({
      text: {
        text: pangoMarkup,
        rgba: true,
        width: textZoneWidth,
        align,
        justify: false,
        dpi: 72,
        spacing: lineSpacing,
      },
    }).png().toBuffer();
    const meta = await sharp(textImage).metadata();
    const tooTall = meta.height! > maxTextH;
    const tooWide = meta.width! > textZoneWidth;
    if (tooTall || tooWide) {
      fontSize = Math.round(fontSize * 0.85);
    } else {
      break;
    }
  }

  const textMeta = await sharp(textImage).metadata();
  const textW = textMeta.width!;
  const textH = textMeta.height!;

  // Build subtitle image if provided — sized to fit on one line
  let subtitleImage: Buffer | null = null;
  let subtitleW = 0;
  let subtitleH = 0;
  if (subtitle && subtitle.trim()) {
    let subFontSize = Math.round(fontSize * 0.38);
    // Estimate if subtitle fits on one line; shrink if needed
    const estSubWidth = subtitle.length * subFontSize * 0.55;
    if (estSubWidth > textZoneWidth * 0.95) {
      subFontSize = Math.round((textZoneWidth * 0.95) / (subtitle.length * 0.55));
    }
    const escapedSub = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const subMarkup = `<span foreground="${textColor}" font_desc="${style.subtitleFontFamily} ${subFontSize}px">${escapedSub}</span>`;
    subtitleImage = await sharp({
      text: {
        text: subMarkup,
        rgba: true,
        width: textZoneWidth,
        align,
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

  // Horizontal position within text zone based on alignment
  // Ensure text zone stays within canvas: leave 3% padding on each side
  const textZoneX = layout === "right" ? Math.round(width * 0.03) : Math.round(width - textZoneWidth - width * 0.03);
  let left: number;
  if (align === "left") {
    left = Math.round(textZoneX);
  } else if (align === "right") {
    left = Math.round(textZoneX + textZoneWidth - textW);
  } else {
    left = Math.round(textZoneX + (textZoneWidth - textW) / 2);
  }

  // Center text in the available area above the church banner (bottom 11% reserved)
  const availableH = Math.round(height * 0.86);
  const top = Math.round((availableH - totalTextH) / 2);

  // Clamp positions so composites stay within canvas bounds
  const clampLeft = (l: number, w: number) => Math.max(0, Math.min(l, width - w));
  const clampTop = (t: number, h: number) => Math.max(0, Math.min(t, height - h));

  const composites: sharp.OverlayOptions[] = [];

  if (use3D) {
    // 3D extruded text: multiple gray-tinted shadow copies at progressive offsets
    const extrusionLayers = 8;
    const stepScale = Math.max(1, Math.round(fontSize * 0.012));
    // Mid-gray tint for extrusion (not black — looks more like a 3D block)
    const grayLevel = 0.35; // 35% brightness
    const extrusionImage = await sharp(textImage)
      .ensureAlpha()
      .recomb([
        [grayLevel, 0, 0],
        [0, grayLevel, 0],
        [0, 0, grayLevel],
      ])
      .toBuffer();

    // Layer largest-offset first (painter's algorithm)
    for (let i = extrusionLayers; i >= 1; i--) {
      const ox = i * stepScale;
      const oy = i * stepScale;
      composites.push({
        input: extrusionImage,
        left: clampLeft(left + ox, textW),
        top: clampTop(top + oy, textH),
        blend: "over",
      });
    }
    composites.push({ input: textImage, left: clampLeft(left, textW), top: clampTop(top, textH), blend: "over" });
  } else {
    // Flat 2px hard shadow (original behavior)
    const shadowOffset = 2;
    const shadowImage = await sharp(textImage)
      .ensureAlpha()
      .recomb([[0,0,0],[0,0,0],[0,0,0]])
      .toBuffer();
    composites.push(
      { input: shadowImage, left: clampLeft(left + shadowOffset, textW), top: clampTop(top + shadowOffset, textH), blend: "over" },
      { input: textImage, left: clampLeft(left, textW), top: clampTop(top, textH), blend: "over" },
    );
  }

  // Add subtitle and its shadow/extrusion if present
  if (subtitleImage) {
    let subLeft: number;
    if (align === "left") {
      subLeft = Math.round(textZoneX);
    } else if (align === "right") {
      subLeft = Math.round(textZoneX + textZoneWidth - subtitleW);
    } else {
      subLeft = Math.round(textZoneX + (textZoneWidth - subtitleW) / 2);
    }
    const subTop = top + textH + gap;

    if (use3D) {
      const subExtrusionLayers = 6;
      const subStepScale = Math.max(1, Math.round(fontSize * 0.008));
      const grayLevel = 0.35;
      const subExtrusionImage = await sharp(subtitleImage)
        .ensureAlpha()
        .recomb([
          [grayLevel, 0, 0],
          [0, grayLevel, 0],
          [0, 0, grayLevel],
        ])
        .toBuffer();

      for (let i = subExtrusionLayers; i >= 1; i--) {
        const ox = i * subStepScale;
        const oy = i * subStepScale;
        composites.push({
          input: subExtrusionImage,
          left: clampLeft(subLeft + ox, subtitleW),
          top: clampTop(subTop + oy, subtitleH),
          blend: "over",
        });
      }
      composites.push({ input: subtitleImage, left: clampLeft(subLeft, subtitleW), top: clampTop(subTop, subtitleH), blend: "over" });
    } else {
      const shadowOffset = 2;
      const subShadow = await sharp(subtitleImage)
        .ensureAlpha()
        .recomb([[0,0,0],[0,0,0],[0,0,0]])
        .toBuffer();
      composites.push(
        { input: subShadow, left: clampLeft(subLeft + shadowOffset, subtitleW), top: clampTop(subTop + shadowOffset, subtitleH), blend: "over" },
        { input: subtitleImage, left: clampLeft(subLeft, subtitleW), top: clampTop(subTop, subtitleH), blend: "over" },
      );
    }
  }

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function createCenteredTitleLayer(
  width: number, height: number, title: string,
  style: TextStyle, subtitle?: string,
  use3D?: boolean, colorOverride?: string
): Promise<Buffer> {
  const align: TextAlign = "centre";
  const textZoneWidth = Math.round(width * 0.85);

  const words = title.trim().split(/\s+/);
  const wordCount = words.length;
  let fontSize: number;
  if (wordCount <= 2) fontSize = Math.round(height * 0.45);
  else if (wordCount <= 4) fontSize = Math.round(height * 0.34);
  else fontSize = Math.round(height * 0.22);

  const escaped = title.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").toUpperCase();
  const textColor = colorOverride || style.color;

  // Render at initial size, then shrink if text is too tall or too wide
  let textImage!: Buffer;
  const maxTextH = height * 0.75;
  for (let attempt = 0; attempt < 8; attempt++) {
    const pangoMarkup = `<span foreground="${textColor}" font_desc="${style.fontFamily} ${fontSize}px">${escaped}</span>`;
    const lineSpacing = -Math.round(fontSize * 0.25);
    textImage = await sharp({
      text: {
        text: pangoMarkup,
        rgba: true,
        width: textZoneWidth,
        align,
        justify: false,
        dpi: 72,
        spacing: lineSpacing,
      },
    }).png().toBuffer();
    const meta = await sharp(textImage).metadata();
    const tooTall = meta.height! > maxTextH;
    const tooWide = meta.width! > textZoneWidth;
    if (tooTall || tooWide) {
      fontSize = Math.round(fontSize * 0.85);
    } else {
      break;
    }
  }

  const textMeta = await sharp(textImage).metadata();
  const textW = textMeta.width!;
  const textH = textMeta.height!;

  // Build subtitle image if provided
  let subtitleImage: Buffer | null = null;
  let subtitleW = 0;
  let subtitleH = 0;
  if (subtitle && subtitle.trim()) {
    let subFontSize = Math.round(fontSize * 0.38);
    const estSubWidth = subtitle.length * subFontSize * 0.55;
    if (estSubWidth > textZoneWidth * 0.95) {
      subFontSize = Math.round((textZoneWidth * 0.95) / (subtitle.length * 0.55));
    }
    const escapedSub = subtitle.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const subMarkup = `<span foreground="${textColor}" font_desc="${style.subtitleFontFamily} ${subFontSize}px">${escapedSub}</span>`;
    subtitleImage = await sharp({
      text: {
        text: subMarkup,
        rgba: true,
        width: textZoneWidth,
        align,
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

  // Center everything on canvas
  const left = Math.round((width - textW) / 2);
  const top = Math.round((height - totalTextH) / 2);

  const clampLeft = (l: number, w: number) => Math.max(0, Math.min(l, width - w));
  const clampTop = (t: number, h: number) => Math.max(0, Math.min(t, height - h));

  const composites: sharp.OverlayOptions[] = [];

  if (use3D) {
    const extrusionLayers = 8;
    const stepScale = Math.max(1, Math.round(fontSize * 0.012));
    const grayLevel = 0.35;
    const extrusionImage = await sharp(textImage)
      .ensureAlpha()
      .recomb([
        [grayLevel, 0, 0],
        [0, grayLevel, 0],
        [0, 0, grayLevel],
      ])
      .toBuffer();

    for (let i = extrusionLayers; i >= 1; i--) {
      const ox = i * stepScale;
      const oy = i * stepScale;
      composites.push({
        input: extrusionImage,
        left: clampLeft(left + ox, textW),
        top: clampTop(top + oy, textH),
        blend: "over",
      });
    }
    composites.push({ input: textImage, left: clampLeft(left, textW), top: clampTop(top, textH), blend: "over" });
  } else {
    const shadowOffset = 2;
    const shadowImage = await sharp(textImage)
      .ensureAlpha()
      .recomb([[0,0,0],[0,0,0],[0,0,0]])
      .toBuffer();
    composites.push(
      { input: shadowImage, left: clampLeft(left + shadowOffset, textW), top: clampTop(top + shadowOffset, textH), blend: "over" },
      { input: textImage, left: clampLeft(left, textW), top: clampTop(top, textH), blend: "over" },
    );
  }

  // Subtitle
  if (subtitleImage) {
    const subLeft = Math.round((width - subtitleW) / 2);
    const subTop = top + textH + gap;

    if (use3D) {
      const subExtrusionLayers = 6;
      const subStepScale = Math.max(1, Math.round(fontSize * 0.008));
      const grayLevel = 0.35;
      const subExtrusionImage = await sharp(subtitleImage)
        .ensureAlpha()
        .recomb([
          [grayLevel, 0, 0],
          [0, grayLevel, 0],
          [0, 0, grayLevel],
        ])
        .toBuffer();

      for (let i = subExtrusionLayers; i >= 1; i--) {
        const ox = i * subStepScale;
        const oy = i * subStepScale;
        composites.push({
          input: subExtrusionImage,
          left: clampLeft(subLeft + ox, subtitleW),
          top: clampTop(subTop + oy, subtitleH),
          blend: "over",
        });
      }
      composites.push({ input: subtitleImage, left: clampLeft(subLeft, subtitleW), top: clampTop(subTop, subtitleH), blend: "over" });
    } else {
      const shadowOffset = 2;
      const subShadow = await sharp(subtitleImage)
        .ensureAlpha()
        .recomb([[0,0,0],[0,0,0],[0,0,0]])
        .toBuffer();
      composites.push(
        { input: subShadow, left: clampLeft(subLeft + shadowOffset, subtitleW), top: clampTop(subTop + shadowOffset, subtitleH), blend: "over" },
        { input: subtitleImage, left: clampLeft(subLeft, subtitleW), top: clampTop(subTop, subtitleH), blend: "over" },
      );
    }
  }

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function createChurchBannerLayer(
  width: number, height: number, layout: PastorLayout,
  churchName: string, palette: GradientPalette, style: TextStyle
): Promise<Buffer> {
  const bannerH = Math.round(height * 0.065);
  const bannerY = Math.round(height * 0.89);

  // White banner background
  const r = 255, g = 255, b = 255;
  const bannerAlpha = 220; // ~86%

  // Banner starts from the opposite side of the pastor, extends ~60% across
  const bannerW = Math.round(width * 0.55);
  const bannerX = layout === "right" ? 0 : width - bannerW;

  // Build the banner rectangle as raw RGBA
  const buf = Buffer.alloc(width * height * 4);
  for (let y = bannerY; y < Math.min(bannerY + bannerH, height); y++) {
    for (let x = bannerX; x < Math.min(bannerX + bannerW, width); x++) {
      const idx = (y * width + x) * 4;
      buf[idx] = r;
      buf[idx + 1] = g;
      buf[idx + 2] = b;
      buf[idx + 3] = bannerAlpha;
    }
  }

  const bannerBg = await sharp(buf, { raw: { width, height, channels: 4 } })
    .png().toBuffer();

  // Render church name text
  const textFontSize = Math.round(bannerH * 0.55);
  const escaped = churchName.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").toUpperCase();
  // Dark text on white banner using palette's dark color
  const dr = palette.dark.r.toString(16).padStart(2, "0");
  const dg = palette.dark.g.toString(16).padStart(2, "0");
  const db = palette.dark.b.toString(16).padStart(2, "0");
  const textColor = `#${dr}${dg}${db}`;
  const markup = `<span foreground="${textColor}" font_desc="Montserrat Bold ${textFontSize}px">${escaped}</span>`;

  const textImage = await sharp({
    text: {
      text: markup,
      rgba: true,
      width: bannerW - 40,
      align: layout === "right" ? "left" : "right",
      justify: false,
      dpi: 72,
    },
  }).png().toBuffer();

  const textMeta = await sharp(textImage).metadata();
  const textW = textMeta.width!;
  const textH = textMeta.height!;

  // Center text vertically in banner, pad horizontally from the banner's outer edge
  const textTop = Math.round(bannerY + (bannerH - textH) / 2);
  let textLeft: number;
  if (layout === "right") {
    // Banner on left side — text padded from left edge
    textLeft = bannerX + 20;
  } else {
    // Banner on right side — text padded from right edge
    textLeft = bannerX + bannerW - textW - 20;
  }

  return sharp({ create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([
      { input: bannerBg, blend: "over" },
      { input: textImage, left: Math.max(0, textLeft), top: Math.max(0, textTop), blend: "over" },
    ])
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

  // Shadow: black copy, blurred, offset down-right (randomized)
  const shadowOffset = 4 + Math.floor(Math.random() * 7); // 4-10px
  const shadowLayer = await sharp(scaledPastor)
    .ensureAlpha()
    .recomb([[0,0,0],[0,0,0],[0,0,0]])
    .blur(8)
    .toBuffer();

  // Glow: accent-colored copy, blurred wider — 30% chance of no glow
  const useGlow = Math.random() > 0.3;
  const glowBlur = 8 + Math.floor(Math.random() * 11); // 8-18px
  let glowLayer: Buffer | null = null;
  if (useGlow) {
    glowLayer = await sharp(scaledPastor)
      .ensureAlpha()
      .tint(palette.accent)
      .blur(glowBlur)
      .toBuffer();
  }

  // Composite onto full-size canvas: glow (optional) → shadow → pastor
  const pastorComposites: sharp.OverlayOptions[] = [];
  if (glowLayer) {
    pastorComposites.push({ input: glowLayer, left: Math.max(0, left), top: Math.max(0, top), blend: "over" });
  }
  pastorComposites.push(
    { input: shadowLayer, left: Math.max(0, left + shadowOffset), top: Math.max(0, top + shadowOffset), blend: "over" },
    { input: scaledPastor, left: Math.max(0, left), top: Math.max(0, top), blend: "over" },
  );

  return sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite(pastorComposites)
    .png()
    .toBuffer();
}

// (Old OpenAI prompt builders and variety pools removed — all modes are now programmatic)

/**
 * Mode 1: Pastor + Title — fully programmatic (no AI).
 * Composites: gradient background + texture overlay + title text + uploaded pastor PNG.
 */
export async function generatePastorTitleProgrammatic(
  pastorImageUrl: string,
  title: string,
  layout: PastorLayout,
  subtitle?: string,
  forceStyleIndex?: number
): Promise<Buffer> {
  const width = THUMB_WIDTH;
  const height = THUMB_HEIGHT;

  const use3D = Math.random() < 0.35;

  let { paletteIdx, textureIdx, styleIdx, strategyIdx } = pickProgrammaticCombo();

  // When 3D is enabled, bias toward lighter palettes (50% chance to pick a light palette)
  const lightPaletteStartIdx = GRADIENT_PALETTES.findIndex(p => p.name === "light-sky-blue");
  if (use3D && lightPaletteStartIdx >= 0 && Math.random() < 0.5) {
    const lightCount = GRADIENT_PALETTES.length - lightPaletteStartIdx;
    paletteIdx = lightPaletteStartIdx + Math.floor(Math.random() * lightCount);
  }

  const palette = GRADIENT_PALETTES[paletteIdx];
  const textureType = TEXTURE_TYPES[textureIdx];
  const textStyle = forceStyleIndex != null ? TEXT_STYLES[forceStyleIndex % TEXT_STYLES.length] : TEXT_STYLES[styleIdx];
  const gradientStrategy = GRADIENT_STRATEGIES[strategyIdx];
  const textureOpacity = 0.25 + Math.random() * 0.15;
  const useBokeh = Math.random() < 0.55;
  const useColorGrade = Math.random() < 0.70;
  const hue = Math.round(-15 + Math.random() * 30);
  const saturation = 0.85 + Math.random() * 0.35;
  const brightness = 0.95 + Math.random() * 0.10;

  const midBrightness = (palette.mid.r + palette.mid.g + palette.mid.b) / 3;
  const isLightPalette = midBrightness > 150;

  console.log(`[ThumbnailGen] === PASTOR-TITLE-PROGRAMMATIC ===`);
  console.log(`[ThumbnailGen] Title: "${title}" | Subtitle: "${subtitle || "(none)"}" | Layout: ${layout}`);
  console.log(`[ThumbnailGen] Palette: ${palette.name} | Texture: ${textureType} (${(textureOpacity * 100).toFixed(0)}%) | Text style: ${textStyle.name} | Gradient: ${gradientStrategy}`);
  console.log(`[ThumbnailGen] 3D: ${use3D ? "ON" : "OFF"} | Light palette: ${isLightPalette ? "YES" : "NO"} | Bokeh: ${useBokeh ? "ON" : "OFF"} | Color grade: ${useColorGrade ? `ON (hue=${hue}, sat=${saturation.toFixed(2)}, bri=${brightness.toFixed(2)})` : "OFF"}`);

  const startTime = Date.now();

  // Generate all layers in parallel
  const churchName = "First Pentecostal Church of Dallas";
  const [gradientLayer, textureLayer, bokehLayer, titleLayer, pastorLayer, churchBanner] = await Promise.all([
    createGradientLayer(width, height, palette, layout, gradientStrategy),
    createTextureLayer(width, height, textureType, textureOpacity),
    useBokeh ? createBokehLayer(width, height, palette, layout) : Promise.resolve(null),
    createTitleLayer(width, height, title, layout, textStyle, subtitle, undefined, use3D),
    fetchAndPrepPastor(pastorImageUrl, width, height, layout, palette),
    createChurchBannerLayer(width, height, layout, churchName, palette, textStyle),
  ]);

  // Composite: gradient (base) → texture (overlay) → bokeh (screen) → church banner → title (over) → pastor (over)
  const composites: sharp.OverlayOptions[] = [
    { input: textureLayer, blend: "overlay" as any },
  ];
  if (bokehLayer) {
    composites.push({ input: bokehLayer, blend: "screen" as any });
  }
  composites.push(
    { input: churchBanner, blend: "over" },
    { input: titleLayer, blend: "over" },
    { input: pastorLayer, blend: "over" },
  );

  let pipeline = sharp(gradientLayer).composite(composites);
  if (useColorGrade) {
    pipeline = pipeline.modulate({ hue, saturation, brightness });
  }
  const result = await pipeline.jpeg({ quality: 90 }).toBuffer();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ThumbnailGen] Programmatic pastor-title done in ${elapsed}s (${result.length} bytes)`);

  return result;
}

/**
 * Mode 2: Title + Service Overlay — fully programmatic (no AI).
 * Snapshot as backdrop, dark overlay, centered title text on top.
 */
export async function generateServiceOverlay(
  snapshotBuffer: Buffer,
  title: string,
  subtitle?: string,
  forceStyleIndex?: number
): Promise<Buffer> {
  const width = THUMB_WIDTH;
  const height = THUMB_HEIGHT;

  const use3D = Math.random() < 0.35;

  const { styleIdx } = pickProgrammaticCombo();
  const textStyle = forceStyleIndex != null ? TEXT_STYLES[forceStyleIndex % TEXT_STYLES.length] : TEXT_STYLES[styleIdx];

  // Dark overlay opacity: 40-55%
  const overlayOpacity = 0.40 + Math.random() * 0.15;
  const useColorGrade = Math.random() < 0.50;
  const hue = Math.round(-10 + Math.random() * 20);
  const saturation = 0.90 + Math.random() * 0.20;
  const brightness = 0.90 + Math.random() * 0.15;

  console.log(`[ThumbnailGen] === SERVICE-OVERLAY (PROGRAMMATIC) ===`);
  console.log(`[ThumbnailGen] Title: "${title}" | Subtitle: "${subtitle || "(none)"}"`);
  console.log(`[ThumbnailGen] Text style: ${textStyle.name} | Overlay: ${(overlayOpacity * 100).toFixed(0)}%`);
  console.log(`[ThumbnailGen] 3D: ${use3D ? "ON" : "OFF"} | Color grade: ${useColorGrade ? "ON" : "OFF"}`);

  const startTime = Date.now();

  // Resize snapshot to canvas dimensions
  const resizedSnapshot = await sharp(snapshotBuffer)
    .resize(width, height, { fit: "cover" })
    .png()
    .toBuffer();

  // Create dark overlay
  const overlayAlpha = Math.round(overlayOpacity * 255);
  const darkOverlay = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: overlayAlpha } },
  }).png().toBuffer();

  // Create centered title layer
  const titleLayer = await createCenteredTitleLayer(width, height, title, textStyle, subtitle, use3D);

  // Composite: snapshot → dark overlay → centered title
  let pipeline = sharp(resizedSnapshot)
    .composite([
      { input: darkOverlay, blend: "over" },
      { input: titleLayer, blend: "over" },
    ]);

  if (useColorGrade) {
    pipeline = pipeline.modulate({ hue, saturation, brightness });
  }

  const result = await pipeline.jpeg({ quality: 90 }).toBuffer();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ThumbnailGen] Programmatic service-overlay done in ${elapsed}s (${result.length} bytes)`);

  return result;
}

/**
 * Mode 3: Title + Colored Background — fully programmatic (no AI).
 * Gradient background + texture + bokeh + centered title text.
 */
export async function generateTitleColoredBg(
  title: string,
  subtitle?: string,
  forceStyleIndex?: number
): Promise<Buffer> {
  const width = THUMB_WIDTH;
  const height = THUMB_HEIGHT;

  const use3D = Math.random() < 0.35;

  let { paletteIdx, textureIdx, styleIdx, strategyIdx } = pickProgrammaticCombo();

  // When 3D is enabled, bias toward lighter palettes (50% chance)
  const lightPaletteStartIdx = GRADIENT_PALETTES.findIndex(p => p.name === "light-sky-blue");
  if (use3D && lightPaletteStartIdx >= 0 && Math.random() < 0.5) {
    const lightCount = GRADIENT_PALETTES.length - lightPaletteStartIdx;
    paletteIdx = lightPaletteStartIdx + Math.floor(Math.random() * lightCount);
  }

  const palette = GRADIENT_PALETTES[paletteIdx];
  const textureType = TEXTURE_TYPES[textureIdx];
  const textStyle = forceStyleIndex != null ? TEXT_STYLES[forceStyleIndex % TEXT_STYLES.length] : TEXT_STYLES[styleIdx];
  const gradientStrategy = GRADIENT_STRATEGIES[strategyIdx];
  const textureOpacity = 0.25 + Math.random() * 0.15;
  const useBokeh = Math.random() < 0.55;
  const useColorGrade = Math.random() < 0.70;
  const hue = Math.round(-15 + Math.random() * 30);
  const saturation = 0.85 + Math.random() * 0.35;
  const brightness = 0.95 + Math.random() * 0.10;

  console.log(`[ThumbnailGen] === TITLE-COLORED-BG (PROGRAMMATIC) ===`);
  console.log(`[ThumbnailGen] Title: "${title}" | Subtitle: "${subtitle || "(none)"}"`);
  console.log(`[ThumbnailGen] Palette: ${palette.name} | Texture: ${textureType} (${(textureOpacity * 100).toFixed(0)}%) | Text style: ${textStyle.name} | Gradient: ${gradientStrategy}`);
  console.log(`[ThumbnailGen] 3D: ${use3D ? "ON" : "OFF"} | Bokeh: ${useBokeh ? "ON" : "OFF"} | Color grade: ${useColorGrade ? "ON" : "OFF"}`);

  const startTime = Date.now();

  // Generate all layers in parallel
  const [gradientLayer, textureLayer, bokehLayer, titleLayer] = await Promise.all([
    createGradientLayer(width, height, palette, "center", gradientStrategy),
    createTextureLayer(width, height, textureType, textureOpacity),
    useBokeh ? createBokehLayer(width, height, palette, "center") : Promise.resolve(null),
    createCenteredTitleLayer(width, height, title, textStyle, subtitle, use3D),
  ]);

  // Composite: gradient → texture (overlay) → bokeh (screen) → centered title
  const composites: sharp.OverlayOptions[] = [
    { input: textureLayer, blend: "overlay" as any },
  ];
  if (bokehLayer) {
    composites.push({ input: bokehLayer, blend: "screen" as any });
  }
  composites.push({ input: titleLayer, blend: "over" });

  let pipeline = sharp(gradientLayer).composite(composites);
  if (useColorGrade) {
    pipeline = pipeline.modulate({ hue, saturation, brightness });
  }
  const result = await pipeline.jpeg({ quality: 90 }).toBuffer();

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[ThumbnailGen] Programmatic title-colored-bg done in ${elapsed}s (${result.length} bytes)`);

  return result;
}
