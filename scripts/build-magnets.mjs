import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { mdToPdf } from "md-to-pdf";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const magnetsDir = path.join(rootDir, "content", "magnets");
const downloadsDir = path.join(rootDir, "public", "downloads");

async function main() {
  await fs.mkdir(downloadsDir, { recursive: true });

  let entries;
  try {
    entries = await fs.readdir(magnetsDir, { withFileTypes: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      console.log(
        `[magnets] No directory: ${path.relative(rootDir, magnetsDir)} (nothing to build).`,
      );
      return;
    }
    throw error;
  }

  const mdFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".md"))
    .map((e) => e.name)
    .sort();

  if (!mdFiles.length) {
    console.log(`[magnets] No .md files found in ${path.relative(rootDir, magnetsDir)}.`);
    return;
  }

  let failed = 0;

  for (const fileName of mdFiles) {
    const inputPath = path.join(magnetsDir, fileName);
    const outputFileName = fileName.replace(/\.md$/i, ".pdf");
    const outputPath = path.join(downloadsDir, outputFileName);

    try {
      await mdToPdf({ path: inputPath }, { dest: outputPath });
      console.log(
        `[magnets] ✓ ${path.relative(rootDir, inputPath)} -> ${path.relative(rootDir, outputPath)}`,
      );
    } catch (error) {
      failed += 1;
      console.error(`[magnets] ✗ Failed to build ${path.relative(rootDir, inputPath)}`);
      console.error(error);
    }
  }

  if (failed) process.exitCode = 1;
}

await main();

