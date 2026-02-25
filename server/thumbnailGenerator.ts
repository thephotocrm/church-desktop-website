import OpenAI from "openai";
import sharp from "sharp";
import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

const STYLE_REF_INSTRUCTION = `The additional images are style reference thumbnails from a professional church. Match their visual style closely — color grading, text treatment, layout, lighting, cinematic feel. Do NOT copy their text or subjects.`;

// --- Variety pools for Title + Colored Background mode ---

const COLOR_PALETTES = [
  "deep navy blue and royal purple with accents of molten gold, like stained glass at night",
  "warm coral, soft peach, and amber tones fading into pale cream, like a sunrise over still water",
  "electric teal and cyan with flashes of hot magenta and dark charcoal, high-energy neon atmosphere",
  "deep emerald green and forest tones contrasted with burnt sienna and ember orange, earthy and alive",
  "soft lavender, icy periwinkle, and silver-white with subtle rose gold highlights, cool and ethereal",
  "rich honey gold, deep bronze, and warm mahogany with bursts of sunlit yellow, like late afternoon light",
  "ultra-deep indigo, dark teal, and black with luminous aquamarine and white light accents, deep sea bioluminescence",
  "oxidized copper green, warm terracotta, and cool slate gray with cream accents, sophisticated and warm",
  "deep crimson, burgundy wine, and dark plum with polished gold leaf accents, rich and regal",
  "ice blue, pale mint, and soft white with streaks of pale pink and warm gray, crisp winter morning light",
];

const DESIGN_ELEMENTS = [
  "sharp crystalline geometric shapes, overlapping translucent triangles and hexagons with glass-like refraction",
  "large soft out-of-focus bokeh circles of varying sizes, dreamy and luminous like distant city lights",
  "smooth undulating silk fabric folds with gentle sheen and soft shadows, flowing and organic",
  "dramatic volumetric light rays cutting through atmospheric haze, god rays streaming through clouds",
  "loose watercolor paint washes bleeding and feathering into each other, wet-on-wet artistic texture",
  "thousands of tiny luminous particles and dust motes suspended in space, constellation-like scatter with depth",
  "polished marble veining patterns with metallic foil inlay, luxurious natural stone texture with depth",
  "swirling ink-in-water smoke tendrils, wispy and turbulent vapor trails with sharp and diffused edges",
  "bold impasto paint strokes with visible texture and thick ridges, expressive brushwork like an abstract oil painting",
  "subtle perspective grid lines fading into depth with glowing node intersections, clean modern tech aesthetic",
];

const COMPOSITIONS = [
  "radiating outward from the center, brighter at the center and deeper at the edges, creating a focal spotlight",
  "sweeping diagonally from the bottom-left to the upper-right, with colors transitioning along the diagonal",
  "arranged in wide horizontal bands, layered like a landscape horizon with distinct zones from top to bottom",
  "concentrated in the corners and edges, leaving the center darker and open, creating a natural vignette frame",
  "divided into two unequal zones along a curved line, each side using a different intensity of the palette",
  "scattered organically across the canvas at varying scales and opacities, some elements large and blurred in foreground, others small and sharp behind, creating parallax depth",
];

// Anti-repeat ring buffer: stores last 12 combo indices to avoid near-duplicates
const recentCombos: Array<[number, number, number]> = [];
const HISTORY_SIZE = 12;

function pickDiverseCombo(): { palette: number; element: number; composition: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      palette: Math.floor(Math.random() * COLOR_PALETTES.length),
      element: Math.floor(Math.random() * DESIGN_ELEMENTS.length),
      composition: Math.floor(Math.random() * COMPOSITIONS.length),
    };
    const tooSimilar = recentCombos.some(([p, e, co]) => {
      let m = 0;
      if (p === c.palette) m++;
      if (e === c.element) m++;
      if (co === c.composition) m++;
      return m >= 2;
    });
    if (!tooSimilar) {
      recentCombos.push([c.palette, c.element, c.composition]);
      if (recentCombos.length > HISTORY_SIZE) recentCombos.shift();
      return c;
    }
  }
  // Fallback (extremely unlikely with 600 combos vs 12 history)
  const f = {
    palette: Math.floor(Math.random() * COLOR_PALETTES.length),
    element: Math.floor(Math.random() * DESIGN_ELEMENTS.length),
    composition: Math.floor(Math.random() * COMPOSITIONS.length),
  };
  recentCombos.push([f.palette, f.element, f.composition]);
  if (recentCombos.length > HISTORY_SIZE) recentCombos.shift();
  return f;
}

function buildPastorTitlePrompt(title: string, hasStyleReferences: boolean): string {
  let prompt = `Transform this into a professional YouTube thumbnail for a church sermon titled "${title}". The image contains a person (pastor/speaker) — keep them clearly visible and prominent on the right side. Do NOT alter their face or appearance. COMPLETELY REPLACE the background — remove the original background entirely and replace it with a vibrant, colorful, eye-catching design. Use bold saturated colors (deep blues, rich purples, warm oranges, electric teals) with abstract shapes, gradients, light rays, or bokeh effects. The background should be visually striking and modern — NOT dark or muted. Add large bold text "${title}" on the left side in a clean, modern sans-serif font. The text should be white or bright and highly readable against the colorful background. Professional church media / YouTube thumbnail style, 16:9 aspect ratio.`;
  if (hasStyleReferences) {
    prompt += ` ${STYLE_REF_INSTRUCTION}`;
  }
  return prompt;
}

function buildServiceOverlayPrompt(title: string): string {
  return `Transform this image into a professional YouTube thumbnail for a church sermon titled "${title}". Use the provided image as a background scene — apply a subtle darkening overlay or color grade to make it serve as a cinematic backdrop. Do NOT preserve or highlight any specific person. Place large, bold, CENTERED text "${title}" prominently in the middle of the thumbnail. The text should be the dominant visual element — large, white or bright, with a clean modern sans-serif font. Add a slight text shadow or glow to ensure readability over the background image. The result should look like a professional YouTube thumbnail with the service scene creating atmosphere behind the title text. 16:9 aspect ratio.`;
}

function buildTitleColoredBgPrompt(title: string): { prompt: string; combo: { palette: number; element: number; composition: number } } {
  const combo = pickDiverseCombo();
  const palette = COLOR_PALETTES[combo.palette];
  const element = DESIGN_ELEMENTS[combo.element];
  const composition = COMPOSITIONS[combo.composition];

  const prompt = [
    `Create a professional YouTube thumbnail for a church sermon titled "${title}".`,
    ``,
    `BACKGROUND DESIGN:`,
    `Color palette: ${palette}.`,
    `Visual elements: ${element}.`,
    `Layout: The background elements are ${composition}.`,
    `The overall mood should feel uplifting, modern, and spiritually inviting.`,
    ``,
    `TEXT:`,
    `Place large, bold, CENTERED text "${title}" prominently in the middle of the image.`,
    `The text must be the dominant visual element — large, white or very bright, in a clean modern sans-serif font.`,
    `Add a subtle drop shadow or outer glow behind the text to guarantee readability over any background.`,
    ``,
    `CONSTRAINTS:`,
    `Do NOT include any people, human figures, or faces.`,
    `Professional church media style. 16:9 aspect ratio.`,
  ].join("\n");

  return { prompt, combo };
}

/** Fetch up to `maxCount` random active style reference images as File objects */
async function getStyleReferenceFiles(category = "pastor-title", maxCount = 4): Promise<File[]> {
  try {
    const refs = await storage.getActiveStyleReferences(category);
    if (refs.length === 0) return [];

    // Randomly select up to maxCount
    const shuffled = refs.sort(() => Math.random() - 0.5).slice(0, maxCount);

    const files: File[] = [];
    for (const ref of shuffled) {
      try {
        const response = await fetch(ref.r2Url);
        if (!response.ok) continue;
        const arrayBuf = await response.arrayBuffer();
        const pngBuffer = await sharp(Buffer.from(arrayBuf)).png().toBuffer();
        files.push(new File([pngBuffer], `ref-${ref.sourceVideoId}.png`, { type: "image/png" }));
      } catch (err) {
        console.warn(`[ThumbnailGen] Failed to load style reference ${ref.sourceVideoId}:`, err);
      }
    }
    return files;
  } catch (err) {
    console.warn("[ThumbnailGen] Failed to load style references:", err);
    return [];
  }
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
 * Mode 1: Pastor + Title — snapshot of pastor → colorful background with title.
 * Uses images.edit() with snapshot + style refs (category "pastor-title").
 * Only mode that uses style references.
 */
export async function generatePastorTitle(
  snapshotBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  const snapshotFile = new File([snapshotPng], "snapshot.png", { type: "image/png" });

  const refFiles = await getStyleReferenceFiles("pastor-title", 4);
  const hasRefs = refFiles.length > 0;

  const imageInput: File[] = [snapshotFile, ...refFiles];

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageInput as any,
    prompt: buildPastorTitlePrompt(title, hasRefs),
    size: "1536x1024",
    ...(hasRefs ? { input_fidelity: "high" } : {}),
  } as any);

  return decodeAndResize(response);
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

  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  const snapshotFile = new File([snapshotPng], "snapshot.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: [snapshotFile] as any,
    prompt: buildServiceOverlayPrompt(title),
    size: "1536x1024",
  } as any);

  return decodeAndResize(response);
}

/**
 * Mode 3: Title + Colored Background — AI generates vibrant background with centered title.
 * Uses images.generate() only (no snapshot, no style refs).
 */
export async function generateTitleColoredBg(
  title: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const { prompt, combo } = buildTitleColoredBgPrompt(title);
  console.log(`[ThumbnailGen] title-background combo: palette=${combo.palette}, element=${combo.element}, composition=${combo.composition}`);

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1536x1024",
  });

  return decodeAndResize(response);
}
