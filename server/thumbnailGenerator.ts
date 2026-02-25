import OpenAI from "openai";
import sharp from "sharp";
import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

const STYLE_REF_INSTRUCTION = `The additional images are style reference thumbnails from a professional church. Match their visual style closely — color grading, text treatment, layout, lighting, cinematic feel. Do NOT copy their text or subjects.`;

// --- Variety pools for Title + Colored Background mode ---

const COLOR_PALETTES = [
  "warm dusty coral, soft peach, and muted rose blending into warm taupe, like a sun-faded fresco",
  "soft golden amber, warm honey, and creamy wheat tones with touches of burnt sienna, like late afternoon sunlight on old stone",
  "muted sage green, warm olive, and dusty cream with hints of soft terracotta, like a Tuscan landscape in soft focus",
  "dusty mauve, soft plum, and warm blush pink fading into pale champagne, like dried flowers in warm light",
  "warm cinnamon, rich caramel, and soft sand tones blending into muted clay, like desert earth at golden hour",
  "soft steel blue, warm dove gray, and pale cream with subtle lavender undertones, like an overcast sky at dawn",
  "muted teal, warm seafoam, and sandy beige with touches of dusty copper, like weathered coastal patina",
  "warm burgundy, dusty rose, and soft copper fading into antique cream, like aged leather and velvet",
  "soft ochre, warm paprika, and muted terra cotta blending into dusty peach, like sun-baked clay tiles",
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

function buildTitleColoredBgPrompt(title: string, subtitle?: string): { prompt: string; combo: { palette: number; element: number; composition: number } } {
  const combo = pickDiverseCombo();
  const palette = COLOR_PALETTES[combo.palette];
  const element = DESIGN_ELEMENTS[combo.element];
  const composition = COMPOSITIONS[combo.composition];

  const textLines = [
    `TEXT:`,
    `Place large, bold, CENTERED text "${title}" prominently in the middle of the image.`,
    `The text must be the dominant visual element — large, white or very bright, in a clean modern sans-serif font.`,
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
    `The background should look like a soft, warm, hand-painted canvas — muted and elegant, NOT flashy, neon, or digitally sharp.`,
    `Think fine art texture, subtle color transitions, and a calm inviting warmth. No geometric shapes, no bokeh, no glowing effects.`,
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
  title: string,
  subtitle?: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const { prompt, combo } = buildTitleColoredBgPrompt(title, subtitle);
  console.log(`[ThumbnailGen] title-background combo: palette=${combo.palette}, element=${combo.element}, composition=${combo.composition}`);

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    size: "1536x1024",
  });

  return decodeAndResize(response);
}
