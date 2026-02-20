import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Expect 32-byte hex string (64 hex chars)
  if (key.length === 64) {
    return Buffer.from(key, "hex");
  }
  // Fall back to hashing the key to get 32 bytes
  return crypto.createHash("sha256").update(key).digest();
}

export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  // Format: iv:tag:ciphertext (all base64)
  return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decrypt(ciphertext: string): string {
  const key = getKey();
  const parts = ciphertext.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted value format");
  }
  const iv = Buffer.from(parts[0], "base64");
  const tag = Buffer.from(parts[1], "base64");
  const encrypted = Buffer.from(parts[2], "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

export function mask(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const decrypted = decrypt(value);
    if (decrypted.length <= 4) return "****";
    return "****" + decrypted.slice(-4);
  } catch {
    // If decryption fails, mask the raw value
    if (value.length <= 4) return "****";
    return "****" + value.slice(-4);
  }
}

export function isEncrypted(value: string): boolean {
  const parts = value.split(":");
  return parts.length === 3;
}
