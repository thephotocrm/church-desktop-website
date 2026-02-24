import OpenAI from "openai";
import sharp from "sharp";
import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

const STYLE_REF_INSTRUCTION = `The additional images are style reference thumbnails from a professional church. Match their visual style closely — color grading, text treatment, layout, lighting, cinematic feel. Do NOT copy their text or subjects.`;

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

function buildTitleColoredBgPrompt(title: string): string {
  return `Create a professional YouTube thumbnail for a church sermon titled "${title}". Use a vibrant, colorful, eye-catching background design — bold saturated colors (deep blues, rich purples, warm oranges, electric teals) with abstract shapes, gradients, light rays, or bokeh effects. The background should be visually striking and modern. Place large, bold, CENTERED text "${title}" prominently in the middle. The text should be the dominant visual element — large, white or bright, clean modern sans-serif font. Do NOT include any people or human figures. Professional church media / YouTube thumbnail style, 16:9 aspect ratio.`;
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

  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: buildTitleColoredBgPrompt(title),
    size: "1536x1024",
  });

  return decodeAndResize(response);
}
