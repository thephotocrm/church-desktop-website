import OpenAI from "openai";
import sharp from "sharp";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;
const BLANK_BRIGHTNESS_THRESHOLD = 15;

/** Check if an image is blank/dark by examining average brightness across all channels. */
async function isBlankImage(buffer: Buffer): Promise<boolean> {
  const { channels } = await sharp(buffer).stats();
  const meanBrightness =
    channels.reduce((sum, ch) => sum + ch.mean, 0) / channels.length;
  return meanBrightness < BLANK_BRIGHTNESS_THRESHOLD;
}

function buildEditPrompt(title: string): string {
  return `Transform this into a professional YouTube thumbnail for a church sermon titled "${title}". If a person is visible in the image, keep them clearly visible and prominent on the right side — do NOT alter their appearance. If no person is visible, do not add or fabricate any person. Replace the background with a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" on the left side. Professional church media style.`;
}

function buildGeneratePrompt(title: string): string {
  return `Create a professional YouTube thumbnail for a church sermon titled "${title}". Use a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" prominently. Do not include any people. Professional church media style, 16:9 aspect ratio.`;
}

/**
 * Generate a unique AI-designed YouTube-style thumbnail using OpenAI gpt-image-1.
 * Detects blank/dark snapshots and branches accordingly:
 * - Blank image → generates a title-only thumbnail (no fabricated person)
 * - Image with content → edits the snapshot, preserving any visible person
 */
export async function generateThumbnail(
  snapshotBuffer: Buffer,
  title: string
): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });

  let response;

  if (await isBlankImage(snapshotBuffer)) {
    // Blank/dark image — generate from scratch without any person
    response = await openai.images.generate({
      model: "gpt-image-1",
      prompt: buildGeneratePrompt(title),
      size: "1536x1024",
    });
  } else {
    // Image has content — edit it, preserving any visible person
    const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
    const file = new File([snapshotPng], "snapshot.png", { type: "image/png" });

    response = await openai.images.edit({
      model: "gpt-image-1",
      image: file,
      prompt: buildEditPrompt(title),
      size: "1536x1024",
    });
  }

  // Get result image data (base64)
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

  // Resize to exact 1280x720 and convert to JPEG
  const result = await sharp(imageBuffer)
    .resize(THUMB_WIDTH, THUMB_HEIGHT, { fit: "cover" })
    .jpeg({ quality: 90 })
    .toBuffer();

  return result;
}
