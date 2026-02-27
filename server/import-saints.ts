/**
 * Import saints from an XLS/XLSX file into the members table.
 *
 * Usage (CLI):
 *   npx tsx server/import-saints.ts path/to/saints.xlsx
 *
 * Or call importSaintsFromBuffer(buffer) from the admin upload endpoint.
 *
 * XLS columns expected: First, Middle, Last, Suffix, Person Type, Gender, Family Relation, Title, Greeting
 */

import fs from "fs";
import XLSX from "xlsx";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { members } from "@shared/schema";

const IMPORT_EMAIL_DOMAIN = "import.fpcd.local";

// Only store meaningful church titles
const MEANINGFUL_TITLES = new Set([
  "pastor",
  "bishop",
  "elder",
  "deacon",
  "deaconess",
  "minister",
  "reverend",
  "apostle",
  "evangelist",
  "prophet",
  "prophetess",
  "mother",
  "sister",
  "brother",
]);

function extractTitle(title?: string, greeting?: string): string | null {
  for (const raw of [title, greeting]) {
    if (!raw) continue;
    const cleaned = raw.replace(/[.\s]/g, "").toLowerCase();
    if (MEANINGFUL_TITLES.has(cleaned)) {
      // Capitalize first letter
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
  }
  return null;
}

function makeEmail(first: string, last: string): string {
  const shortId = crypto.randomBytes(3).toString("hex"); // 6-char hex
  const safe = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 30) || "x";
  return `${safe(first)}.${safe(last)}.${shortId}@${IMPORT_EMAIL_DOMAIN}`;
}

export async function importSaintsFromBuffer(
  buffer: Buffer,
): Promise<{ imported: number; skipped: number; issues: string[] }> {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet);

  // Hash a random UUID once — every imported member gets an unusable password
  const unusablePassword = await bcrypt.hash(crypto.randomUUID(), 10);

  let imported = 0;
  let skipped = 0;
  const issues: string[] = [];

  for (const row of rows) {
    const firstName = (row["First"] || "").trim();
    const lastName = (row["Last"] || "").trim();

    if (!firstName || !lastName) {
      skipped++;
      issues.push(`Skipped row with missing name: ${JSON.stringify(row)}`);
      continue;
    }

    const title = extractTitle(row["Title"], row["Greeting"]);
    const email = makeEmail(firstName, lastName);

    try {
      await db.insert(members).values({
        firstName,
        lastName,
        email,
        password: unusablePassword,
        title,
        role: "member",
        status: "approved",
      });
      imported++;
    } catch (err: any) {
      issues.push(`Error inserting ${firstName} ${lastName}: ${err.message}`);
    }
  }

  return { imported, skipped, issues };
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx server/import-saints.ts <path-to-xls>");
    process.exit(1);
  }

  const buf = fs.readFileSync(filePath);
  const result = await importSaintsFromBuffer(buf);

  console.log(`\n=== Import Complete ===`);
  console.log(`Imported: ${result.imported}`);
  console.log(`Skipped:  ${result.skipped}`);
  if (result.issues.length > 0) {
    console.log(`\nIssues:`);
    result.issues.forEach((issue) => console.log(`  - ${issue}`));
  }

  process.exit(0);
}

// Only run CLI when executed directly (not when imported as a module)
const isDirectRun =
  process.argv[1]?.endsWith("import-saints.ts") ||
  process.argv[1]?.endsWith("import-saints.js");

if (isDirectRun) {
  main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
}
