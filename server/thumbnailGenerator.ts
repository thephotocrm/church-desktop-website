import OpenAI from "openai";
import sharp from "sharp";
import { removeBackground } from "@imgly/background-removal-node";
import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

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

// --- Variety pools for Pastor + Title mode ---

const BG_COLOR_PALETTES = [
  "deep royal blue and electric teal with bright cyan accents",
  "rich purple and vibrant magenta with soft violet highlights",
  "warm burnt orange and golden amber with fiery red-orange accents",
  "bold crimson red and deep maroon with warm gold highlights",
  "vivid emerald green and bright lime with teal undertones",
  "deep indigo and bright cobalt blue with electric purple accents",
  "rich sunset orange, hot pink, and warm coral gradient",
  "saturated teal and bright turquoise with deep navy anchoring",
  "bold magenta and electric pink with deep plum shadows",
  "warm gold and rich bronze with deep amber undertones",
];

const BG_DESIGN_ELEMENTS = [
  "dramatic light rays radiating outward from behind the person, volumetric and glowing",
  "soft bokeh circles of varying sizes, gently glowing and layered at different depths",
  "smooth sweeping gradient swooshes and curved bands of color flowing across the frame",
  "subtle geometric accent shapes — triangles, hexagons — scattered and semi-transparent",
  "atmospheric smoke and mist drifting gently, adding depth and mystery",
  "particle dust and tiny light specks floating in the air, like golden dust motes",
  "abstract paint splashes and bold brush strokes behind the person, artistic and energetic",
  "concentric circular ripples of light emanating from behind the person, subtle and layered",
  "diagonal streaks of light and color, dynamic and modern with motion blur",
  "soft cloud-like shapes and ethereal wisps of color blending organically",
];

const BG_COMPOSITIONS = [
  "radial glow centered behind the person, brightest near their silhouette and fading outward",
  "diagonal gradient sweeping from bottom-left to top-right with bold color transitions",
  "split-tone background — darker on one side, brighter on the other, creating contrast",
  "vignette with vivid color in the center fading to deep dark edges",
  "horizontal layered bands of color with soft blending between them",
  "asymmetric color blocks with organic flowing boundaries between zones",
];

const TITLE_TREATMENTS = [
  "white bold text with a strong dark drop shadow for maximum contrast",
  "bright white outlined text with thick stroke and subtle inner glow",
  "gradient-filled text shifting from white to light gold, bold and luminous",
  "white text with a bold colored outline matching the background palette accent color",
  "bright yellow-white text with a soft outer glow halo effect",
  "clean white text with a subtle 3D extrusion shadow giving depth",
  "bold white text with each word slightly staggered in size for emphasis hierarchy",
  "crisp white condensed uppercase text with generous letter spacing and drop shadow",
];

// Anti-repeat ring buffer for pastor-title combos
const recentPastorCombos: Array<[number, number, number, number]> = [];
const PASTOR_HISTORY_SIZE = 12;

function pickDiversePastorCombo(): { palette: number; element: number; composition: number; treatment: number } {
  for (let i = 0; i < 20; i++) {
    const c = {
      palette: Math.floor(Math.random() * BG_COLOR_PALETTES.length),
      element: Math.floor(Math.random() * BG_DESIGN_ELEMENTS.length),
      composition: Math.floor(Math.random() * BG_COMPOSITIONS.length),
      treatment: Math.floor(Math.random() * TITLE_TREATMENTS.length),
    };
    const tooSimilar = recentPastorCombos.some(([p, e, co, t]) => {
      let m = 0;
      if (p === c.palette) m++;
      if (e === c.element) m++;
      if (co === c.composition) m++;
      if (t === c.treatment) m++;
      return m >= 2;
    });
    if (!tooSimilar) {
      recentPastorCombos.push([c.palette, c.element, c.composition, c.treatment]);
      if (recentPastorCombos.length > PASTOR_HISTORY_SIZE) recentPastorCombos.shift();
      return c;
    }
  }
  const f = {
    palette: Math.floor(Math.random() * BG_COLOR_PALETTES.length),
    element: Math.floor(Math.random() * BG_DESIGN_ELEMENTS.length),
    composition: Math.floor(Math.random() * BG_COMPOSITIONS.length),
    treatment: Math.floor(Math.random() * TITLE_TREATMENTS.length),
  };
  recentPastorCombos.push([f.palette, f.element, f.composition, f.treatment]);
  if (recentPastorCombos.length > PASTOR_HISTORY_SIZE) recentPastorCombos.shift();
  return f;
}

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

function buildPastorTitlePrompt(title: string): { prompt: string; combo: { palette: number; element: number; composition: number; treatment: number } } {
  const combo = pickDiversePastorCombo();
  const palette = BG_COLOR_PALETTES[combo.palette];
  const element = BG_DESIGN_ELEMENTS[combo.element];
  const composition = BG_COMPOSITIONS[combo.composition];
  const treatment = TITLE_TREATMENTS[combo.treatment];

  const sections = [
    `Place this person onto a vibrant new background for a YouTube thumbnail. The person's background has already been removed.`,
    ``,
    `Keep the person EXACTLY as they appear — same face, skin, hair, clothes, expression. Do not redraw or alter the person in any way.`,
    ``,
    `Background: ${palette}. Effect: ${element}. Layout: ${composition}.`,
    `Position the person on the right ~40% of the frame.`,
    ``,
    `Add large bold text "${title}" on the left ~55% of the frame. Style: ${treatment}. Text must be readable.`,
    `Professional church YouTube thumbnail, 16:9 aspect ratio.`,
  ];

  return { prompt: sections.join("\n"), combo };
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

  console.log(`[ThumbnailGen] Input snapshot buffer: ${snapshotBuffer.length} bytes`);
  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  console.log(`[ThumbnailGen] Converted snapshot PNG: ${snapshotPng.length} bytes`);

  // Remove background to isolate the person
  console.log(`[ThumbnailGen] Removing background from snapshot...`);
  const bgRemoveStart = Date.now();
  const foregroundBlob = await removeBackground(snapshotPng, {
    output: { format: "image/png", quality: 1 },
  });
  const foregroundBuffer = Buffer.from(await foregroundBlob.arrayBuffer());
  console.log(`[ThumbnailGen] Background removed in ${((Date.now() - bgRemoveStart) / 1000).toFixed(1)}s — ${foregroundBuffer.length} bytes`);

  // Build mask from alpha channel: person=opaque (keep), background=transparent (edit)
  // OpenAI mask convention: transparent areas = where to generate new content
  // The foreground alpha already matches: person is opaque, background is transparent
  const { width, height } = await sharp(foregroundBuffer).metadata() as { width: number; height: number };
  const alpha = await sharp(foregroundBuffer).extractChannel(3).toBuffer();
  const white = Buffer.alloc(width * height, 255);
  const maskPng = await sharp(white, { raw: { width, height, channels: 1 } })
    .joinChannel(alpha)
    .toColourspace("greyalpha")
    .png()
    .toBuffer();
  console.log(`[ThumbnailGen] Generated mask PNG: ${maskPng.length} bytes (${width}x${height})`);

  const snapshotFile = new File([foregroundBuffer], "snapshot.png", { type: "image/png" });
  const maskFile = new File([maskPng], "mask.png", { type: "image/png" });

  const { prompt, combo } = buildPastorTitlePrompt(title);
  console.log(`[ThumbnailGen] === PASTOR-TITLE REQUEST ===`);
  console.log(`[ThumbnailGen] Title: "${title}"`);
  console.log(`[ThumbnailGen] Combo: palette=${combo.palette}, element=${combo.element}, composition=${combo.composition}, treatment=${combo.treatment}`);
  console.log(`[ThumbnailGen] Snapshot file: name=${snapshotFile.name}, size=${snapshotFile.size} bytes, type=${snapshotFile.type}`);
  console.log(`[ThumbnailGen] Mask file: name=${maskFile.name}, size=${maskFile.size} bytes, type=${maskFile.type}`);
  console.log(`[ThumbnailGen] FULL PROMPT:\n${prompt}`);
  console.log(`[ThumbnailGen] Calling openai.images.edit() with model=gpt-image-1, size=1536x1024, input_fidelity=high`);

  const startTime = Date.now();
  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: [snapshotFile] as any,
    mask: maskFile as any,
    prompt,
    size: "1536x1024",
    input_fidelity: "high",
  } as any);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[ThumbnailGen] === PASTOR-TITLE RESPONSE (${elapsed}s) ===`);
  console.log(`[ThumbnailGen] Response data items: ${response.data?.length ?? 0}`);
  if (response.data?.[0]) {
    const d: any = response.data[0];
    console.log(`[ThumbnailGen] Has b64_json: ${!!d.b64_json} (${d.b64_json ? d.b64_json.length : 0} chars)`);
    console.log(`[ThumbnailGen] Has url: ${!!d.url}`);
  }

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
