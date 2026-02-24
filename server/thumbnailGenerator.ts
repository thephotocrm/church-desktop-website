import OpenAI from "openai";
import sharp from "sharp";
import { storage } from "./storage";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

const STYLE_REF_INSTRUCTION = `The additional images are style reference thumbnails from a professional church. Match their visual style closely — color grading, text treatment, layout, lighting, cinematic feel. Do NOT copy their text or subjects.`;

function buildEditPrompt(title: string, hasStyleReferences: boolean): string {
  let prompt = `Transform this into a professional YouTube thumbnail for a church sermon titled "${title}". If a person is visible in the image, keep them clearly visible and prominent on the right side — do NOT alter their appearance. If no person is visible, do not add or fabricate any person. Replace the background with a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" on the left side. Professional church media style.`;
  if (hasStyleReferences) {
    prompt += ` ${STYLE_REF_INSTRUCTION}`;
  }
  return prompt;
}

function buildGeneratePrompt(title: string): string {
  return `Create a professional YouTube thumbnail for a church sermon titled "${title}". Use a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" prominently. Do not include any people. Professional church media style, 16:9 aspect ratio.`;
}

function buildTitleOnlyEditPrompt(title: string): string {
  return `Create a professional YouTube thumbnail for a church sermon titled "${title}". Use a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" prominently. Do not include any people. Professional church media style, 16:9 aspect ratio. ${STYLE_REF_INSTRUCTION}`;
}

/** Fetch up to `maxCount` random active style reference images as File objects */
async function getStyleReferenceFiles(maxCount = 4): Promise<File[]> {
  try {
    const refs = await storage.getActiveStyleReferences();
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
 * Generate an AI thumbnail using an existing snapshot (preserves any visible person).
 * Uses openai.images.edit() with the snapshot as the source image.
 * Passes style reference images when available.
 */
export async function generatePastorThumbnail(
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

  const refFiles = await getStyleReferenceFiles(4);
  const hasRefs = refFiles.length > 0;

  const imageInput: File[] = [snapshotFile, ...refFiles];

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: imageInput as any,
    prompt: buildEditPrompt(title, hasRefs),
    size: "1536x1024",
    ...(hasRefs ? { input_fidelity: "high" } : {}),
  } as any);

  return decodeAndResize(response);
}

/**
 * Generate a title-only AI thumbnail (no person).
 * If style references are available, uses images.edit() with references.
 * Otherwise falls back to images.generate().
 */
export async function generateTitleOnlyThumbnail(
  title: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  const refFiles = await getStyleReferenceFiles(4);

  if (refFiles.length > 0) {
    // Use images.edit() with style references so the AI can see the style
    const response = await openai.images.edit({
      model: "gpt-image-1",
      image: refFiles as any,
      prompt: buildTitleOnlyEditPrompt(title),
      size: "1536x1024",
      input_fidelity: "high",
    } as any);

    return decodeAndResize(response);
  }

  // Fallback: no references available, use images.generate()
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt: buildGeneratePrompt(title),
    size: "1536x1024",
  });

  return decodeAndResize(response);
}
