import OpenAI from "openai";
import sharp from "sharp";

const THUMB_WIDTH = 1280;
const THUMB_HEIGHT = 720;

/**
 * Generate a unique AI-designed YouTube-style thumbnail using OpenAI gpt-image-1.
 * Sends the pastor snapshot as input and prompts the model to redesign the background
 * creatively while keeping the person visible and adding the sermon title as text.
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

  // Convert snapshot buffer to a File object for the API
  const snapshotPng = await sharp(snapshotBuffer).png().toBuffer();
  const file = new File([snapshotPng], "snapshot.png", { type: "image/png" });

  const response = await openai.images.edit({
    model: "gpt-image-1",
    image: file,
    prompt: `Transform this into a professional YouTube thumbnail for a church sermon titled "${title}". Keep the person clearly visible on the right side. Replace the background with a dramatic, cinematic design — dark tones with golden light accents, spiritual atmosphere. Add large bold text "${title}" on the left side. Professional church media style.`,
    size: "1536x1024",
  });

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
