import OpenAI from "openai";
import sharp from "sharp";

import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

// --- Layout analysis types for pastor-title mode ---

type SubjectZone = "LEFT_HERO" | "RIGHT_HERO" | "CENTER_STAGE";

interface LayoutInfo {
  bbox: { x1: number; y1: number; x2: number; y2: number }; // normalized 0-1
  centroid: { cx: number; cy: number }; // normalized 0-1
  zone: SubjectZone;
  subjectWidthPct: number; // 0-1
  textZone: {
    side: "right" | "left" | "top_bottom";
    from: number; // normalized x or y start
    to: number;   // normalized x or y end
  };
}

function analyzeMask(maskGray: Buffer, width: number, height: number): LayoutInfo {
  let minX = width, maxX = 0, minY = height, maxY = 0;
  let sumX = 0, sumY = 0, count = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (maskGray[y * width + x] >= 128) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sumX += x;
        sumY += y;
        count++;
      }
    }
  }

  // Fallback if mask is empty
  if (count === 0) {
    return {
      bbox: { x1: 0.3, y1: 0.1, x2: 0.7, y2: 0.9 },
      centroid: { cx: 0.5, cy: 0.5 },
      zone: "CENTER_STAGE",
      subjectWidthPct: 0.4,
      textZone: { side: "top_bottom", from: 0, to: 1 },
    };
  }

  const bbox = {
    x1: minX / width,
    y1: minY / height,
    x2: maxX / width,
    y2: maxY / height,
  };
  const centroid = {
    cx: sumX / count / width,
    cy: sumY / count / height,
  };
  const subjectWidthPct = bbox.x2 - bbox.x1;

  let zone: SubjectZone;
  if (subjectWidthPct > 0.55) {
    zone = "CENTER_STAGE";
  } else if (centroid.cx < 0.45) {
    zone = "LEFT_HERO";
  } else if (centroid.cx > 0.55) {
    zone = "RIGHT_HERO";
  } else {
    zone = "CENTER_STAGE";
  }

  const PADDING = 0.05;
  let textZone: LayoutInfo["textZone"];
  if (zone === "LEFT_HERO") {
    textZone = { side: "right", from: bbox.x2 + PADDING, to: 1.0 };
  } else if (zone === "RIGHT_HERO") {
    textZone = { side: "left", from: 0.0, to: bbox.x1 - PADDING };
  } else {
    textZone = { side: "top_bottom", from: 0.0, to: 1.0 };
  }

  return { bbox, centroid, zone, subjectWidthPct, textZone };
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

const COMPOSITIONS_LEFT_HERO = [
  "radial glow on the left side behind the person, fading to darker tones on the right",
  "spotlight beam coming from the upper-left illuminating the left portion, right side in shadow",
  "gradient flowing from bright warm tones on the left to deep cool tones on the right",
  "volumetric light rays emanating from behind the person on the left, dissipating rightward",
];

const COMPOSITIONS_RIGHT_HERO = [
  "radial glow on the right side behind the person, fading to darker tones on the left",
  "spotlight beam coming from the upper-right illuminating the right portion, left side in shadow",
  "gradient flowing from deep cool tones on the left to bright warm tones on the right",
  "volumetric light rays emanating from behind the person on the right, dissipating leftward",
];

const COMPOSITIONS_CENTER_STAGE = [
  "centered radial glow behind the person, brightest at center fading to dark edges",
  "symmetric vignette with vivid color in the center fading equally to deep dark edges",
  "stage lighting from below and above, illuminating center with dramatic falloff to sides",
  "concentric rings of light centered on the person, alternating bright and subtle dark bands",
];

function getCompositionsForZone(zone: SubjectZone): string[] {
  switch (zone) {
    case "LEFT_HERO": return COMPOSITIONS_LEFT_HERO;
    case "RIGHT_HERO": return COMPOSITIONS_RIGHT_HERO;
    case "CENTER_STAGE": return COMPOSITIONS_CENTER_STAGE;
  }
}

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

function pickDiversePastorCombo(zone: SubjectZone): { palette: number; element: number; composition: number; treatment: number } {
  const compositions = getCompositionsForZone(zone);
  for (let i = 0; i < 20; i++) {
    const c = {
      palette: Math.floor(Math.random() * BG_COLOR_PALETTES.length),
      element: Math.floor(Math.random() * BG_DESIGN_ELEMENTS.length),
      composition: Math.floor(Math.random() * compositions.length),
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
    composition: Math.floor(Math.random() * compositions.length),
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

function buildPastorTitlePrompt(title: string, layoutInfo: LayoutInfo): { prompt: string; combo: { palette: number; element: number; composition: number; treatment: number } } {
  const combo = pickDiversePastorCombo(layoutInfo.zone);
  const compositions = getCompositionsForZone(layoutInfo.zone);
  const palette = BG_COLOR_PALETTES[combo.palette];
  const element = BG_DESIGN_ELEMENTS[combo.element];
  const composition = compositions[combo.composition];
  const treatment = TITLE_TREATMENTS[combo.treatment];

  const subjectLeftPct = Math.round(layoutInfo.bbox.x1 * 100);
  const subjectRightPct = Math.round(layoutInfo.bbox.x2 * 100);
  const textFromPct = Math.round(layoutInfo.textZone.from * 100);
  const textToPct = Math.round(layoutInfo.textZone.to * 100);

  let layoutSection: string[];
  let textSection: string[];
  let depthSection: string[];

  if (layoutInfo.zone === "LEFT_HERO") {
    layoutSection = [
      `LAYOUT: Left Hero Composition`,
      `- The person is positioned in the left ~${subjectRightPct}% of the frame.`,
      `- The right ${100 - subjectRightPct}% is the TEXT ZONE — darken this area for text contrast.`,
      `- Create a soft radial glow behind the person on the left side.`,
      `- Gradient: lighter left (behind person), darker toward right.`,
    ];
    textSection = [
      `TEXT PLACEMENT:`,
      `- Place title "${title}" in the RIGHT portion (text zone, right ${textToPct - textFromPct}%)`,
      `- Style: ${treatment}`,
      `- Text MUST NOT extend into the left ${subjectRightPct}% where the person is`,
    ];
    depthSection = [
      `DEPTH & POLISH:`,
      `- Atmospheric separation between person zone and background`,
      `- Vignette darkening edges, heavier on the right side`,
      `- Composition should feel designed around the person's left-side position`,
    ];
  } else if (layoutInfo.zone === "RIGHT_HERO") {
    layoutSection = [
      `LAYOUT: Right Hero Composition`,
      `- The person is positioned in the right ~${100 - subjectLeftPct}% of the frame.`,
      `- The left ${subjectLeftPct}% is the TEXT ZONE — darken this area for text contrast.`,
      `- Create a soft radial glow behind the person on the right side.`,
      `- Gradient: lighter right (behind person), darker toward left.`,
    ];
    textSection = [
      `TEXT PLACEMENT:`,
      `- Place title "${title}" in the LEFT portion (text zone, left ${textToPct - textFromPct}%)`,
      `- Style: ${treatment}`,
      `- Text MUST NOT extend into the right ${100 - subjectLeftPct}% where the person is`,
    ];
    depthSection = [
      `DEPTH & POLISH:`,
      `- Atmospheric separation between person zone and background`,
      `- Vignette darkening edges, heavier on the left side`,
      `- Composition should feel designed around the person's right-side position`,
    ];
  } else {
    layoutSection = [
      `LAYOUT: Center Stage Composition`,
      `- The person is centered in the frame (roughly ${subjectLeftPct}% to ${subjectRightPct}% horizontally).`,
      `- Text zones are ABOVE and BELOW the person.`,
      `- Create a centered radial glow behind the person.`,
      `- Symmetric lighting — darker at top and bottom edges for text contrast.`,
    ];
    textSection = [
      `TEXT PLACEMENT:`,
      `- Place title "${title}" ABOVE or BELOW the person (not overlapping)`,
      `- Style: ${treatment}`,
      `- Text MUST NOT overlap the centered person area`,
    ];
    depthSection = [
      `DEPTH & POLISH:`,
      `- Atmospheric separation between person and background`,
      `- Symmetric vignette darkening all edges equally`,
      `- Composition should feel like professional stage lighting centered on the person`,
    ];
  }

  const sections = [
    `Replace the background with a vibrant YouTube thumbnail background for a church sermon titled "${title}".`,
    ``,
    ...layoutSection,
    ``,
    `BACKGROUND DESIGN:`,
    `- Color palette: ${palette}`,
    `- Effect: ${element} — concentrated in the text zone for energy`,
    `- Light flow: ${composition}`,
    ``,
    ...textSection,
    ``,
    ...depthSection,
    ``,
    `The person in the image must remain exactly as they are — do not alter, redraw, or distort them in any way.`,
    `Professional church media style. 16:9 aspect ratio.`,
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

/** Generate a radial vignette overlay as a multiply-blend layer */
async function createVignetteOverlay(width: number, height: number, layoutInfo: LayoutInfo): Promise<Buffer> {
  // Work at 1/4 resolution for performance
  const qw = Math.max(1, Math.round(width / 4));
  const qh = Math.max(1, Math.round(height / 4));

  // Offset bright center toward subject position
  let cx: number, cy: number;
  if (layoutInfo.zone === "LEFT_HERO") {
    cx = 0.35; cy = 0.5;
  } else if (layoutInfo.zone === "RIGHT_HERO") {
    cx = 0.65; cy = 0.5;
  } else {
    cx = 0.5; cy = 0.5;
  }

  const MIN_BRIGHTNESS = 0.3;
  const buf = Buffer.alloc(qw * qh);

  for (let y = 0; y < qh; y++) {
    for (let x = 0; x < qw; x++) {
      const nx = x / qw;
      const ny = y / qh;
      const dx = nx - cx;
      const dy = ny - cy;
      // Elliptical distance (wider horizontally)
      const dist = Math.sqrt(dx * dx + dy * dy * 1.5);
      const brightness = Math.max(MIN_BRIGHTNESS, 1.0 - dist * 1.2);
      buf[y * qw + x] = Math.round(brightness * 255);
    }
  }

  // Resize up to full resolution and blur for smooth gradient
  return sharp(buf, { raw: { width: qw, height: qh, channels: 1 } })
    .resize(width, height, { fit: "fill" })
    .blur(Math.max(1, Math.round(width / 40)))
    .toBuffer();
}

/**
 * Mode 1: Pastor + Title — send full snapshot + alpha mask to OpenAI images.edit().
 * The mask tells GPT which pixels to keep (pastor) vs edit (background).
 */
export async function generatePastorTitle(
  snapshotBuffer: Buffer,
  title: string,
  maskBuffer: Buffer
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  console.log(`[ThumbnailGen] Input snapshot buffer: ${snapshotBuffer.length} bytes`);

  // Build an OpenAI-compatible mask from the user's brush mask:
  // - alpha=255 (opaque) where user painted (pastor → keep)
  // - alpha=0 (transparent) where user didn't paint (background → edit)
  const snapshotMeta = await sharp(snapshotBuffer).metadata();
  const snapW = snapshotMeta.width!;
  const snapH = snapshotMeta.height!;

  // Resize mask (grayscale) to match snapshot dimensions
  const maskResized = await sharp(maskBuffer)
    .resize(snapW, snapH, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer();

  // Analyze mask to determine subject position and layout zone
  const layoutInfo = analyzeMask(maskResized, snapW, snapH);
  console.log(`[ThumbnailGen] Layout analysis: zone=${layoutInfo.zone}, centroid=(${layoutInfo.centroid.cx.toFixed(2)}, ${layoutInfo.centroid.cy.toFixed(2)}), subjectWidth=${(layoutInfo.subjectWidthPct * 100).toFixed(1)}%, textZone=${layoutInfo.textZone.side} (${(layoutInfo.textZone.from * 100).toFixed(0)}%-${(layoutInfo.textZone.to * 100).toFixed(0)}%)`);

  // Build RGBA mask: opaque where painted (keep), transparent where not (edit)
  const maskRgba = Buffer.alloc(snapW * snapH * 4);
  for (let i = 0; i < snapW * snapH; i++) {
    const keep = maskResized[i] >= 128;
    maskRgba[i * 4]     = 255;  // R
    maskRgba[i * 4 + 1] = 255;  // G
    maskRgba[i * 4 + 2] = 255;  // B
    maskRgba[i * 4 + 3] = keep ? 255 : 0;  // alpha: opaque=keep, transparent=edit
  }

  const maskPng = await sharp(maskRgba, { raw: { width: snapW, height: snapH, channels: 4 } })
    .png()
    .toBuffer();
  console.log(`[ThumbnailGen] Built OpenAI mask PNG: ${maskPng.length} bytes (${snapW}x${snapH})`);

  // Convert full snapshot to PNG for the API
  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  console.log(`[ThumbnailGen] Converted snapshot PNG: ${snapshotPng.length} bytes`);

  // Send full snapshot + mask to OpenAI images.edit() with layout-aware prompt
  const { prompt, combo } = buildPastorTitlePrompt(title, layoutInfo);
  console.log(`[ThumbnailGen] === PASTOR-TITLE REQUEST ===`);
  console.log(`[ThumbnailGen] Title: "${title}"`);
  console.log(`[ThumbnailGen] Zone: ${layoutInfo.zone} | Subject: x=${(layoutInfo.bbox.x1 * 100).toFixed(0)}%-${(layoutInfo.bbox.x2 * 100).toFixed(0)}% | Text: ${layoutInfo.textZone.side}`);
  console.log(`[ThumbnailGen] Combo: palette=${combo.palette}, element=${combo.element}, composition=${combo.composition}, treatment=${combo.treatment}`);
  console.log(`[ThumbnailGen] FULL PROMPT:\n${prompt}`);
  console.log(`[ThumbnailGen] Calling openai.images.edit() with model=gpt-image-1, size=1536x1024, mask=true`);

  const snapshotFile = new File([snapshotPng], "snapshot.png", { type: "image/png" });
  const maskFile = new File([maskPng], "mask.png", { type: "image/png" });

  const startTime = Date.now();
  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: snapshotFile,
    mask: maskFile,
    prompt,
    size: "1536x1024",
  } as any);
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`[ThumbnailGen] === PASTOR-TITLE RESPONSE (${elapsed}s) ===`);
  console.log(`[ThumbnailGen] Response data items: ${response.data?.length ?? 0}`);
  if (response.data?.[0]) {
    const d: any = response.data[0];
    console.log(`[ThumbnailGen] Has b64_json: ${!!d.b64_json} (${d.b64_json ? d.b64_json.length : 0} chars)`);
    console.log(`[ThumbnailGen] Has url: ${!!d.url}`);
  }

  // Decode AI result
  const imageData = response.data?.[0];
  if (!imageData) throw new Error("No image returned from OpenAI");
  let aiBuffer: Buffer;
  if ((imageData as any).b64_json) {
    aiBuffer = Buffer.from((imageData as any).b64_json, "base64");
  } else if ((imageData as any).url) {
    const imgResp = await fetch((imageData as any).url);
    if (!imgResp.ok) throw new Error(`Failed to fetch generated image: ${imgResp.status}`);
    aiBuffer = Buffer.from(await imgResp.arrayBuffer());
  } else {
    throw new Error("Unexpected response format from OpenAI");
  }

  // Resize AI result to match original snapshot dimensions
  const aiResized = await sharp(aiBuffer)
    .resize(snapW, snapH, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer();

  // Build a cutout of the original pastor pixels using the mask
  // (original snapshot pixels where mask is white, transparent elsewhere)
  const snapRaw = await sharp(snapshotBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer();

  const pastorCutout = Buffer.alloc(snapW * snapH * 4);
  for (let i = 0; i < snapW * snapH; i++) {
    const keep = maskResized[i] >= 128;
    if (keep) {
      pastorCutout[i * 4]     = snapRaw[i * 4];
      pastorCutout[i * 4 + 1] = snapRaw[i * 4 + 1];
      pastorCutout[i * 4 + 2] = snapRaw[i * 4 + 2];
      pastorCutout[i * 4 + 3] = 255;
    }
    // else stays 0,0,0,0 (transparent)
  }

  const pastorOverlay = await sharp(pastorCutout, { raw: { width: snapW, height: snapH, channels: 4 } })
    .png()
    .toBuffer();

  // Create vignette overlay to reinforce layout (darker edges, bright near subject)
  const vignetteGray = await createVignetteOverlay(snapW, snapH, layoutInfo);
  // Convert single-channel vignette to RGBA for multiply blend
  const vignetteRgba = Buffer.alloc(snapW * snapH * 4);
  for (let i = 0; i < snapW * snapH; i++) {
    const v = vignetteGray[i];
    vignetteRgba[i * 4]     = v;
    vignetteRgba[i * 4 + 1] = v;
    vignetteRgba[i * 4 + 2] = v;
    vignetteRgba[i * 4 + 3] = 255;
  }
  const vignettePng = await sharp(vignetteRgba, { raw: { width: snapW, height: snapH, channels: 4 } })
    .png()
    .toBuffer();

  // Composite: AI background + vignette (multiply) + original pastor pixels on top
  console.log(`[ThumbnailGen] Compositing: AI bg + vignette (${layoutInfo.zone}) + pastor overlay`);
  const composited = await sharp(aiResized, { raw: { width: snapW, height: snapH, channels: 4 } })
    .composite([
      { input: vignettePng, blend: "multiply" as any },
      { input: pastorOverlay, blend: "over" },
    ])
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return composited;
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
