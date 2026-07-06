import fs from "node:fs/promises";
import path from "node:path";

const projectRoot = process.cwd();
const artifactDirs = [".next"];

async function removeDirIfExists(dirName) {
  const target = path.join(projectRoot, dirName);
  try {
    await fs.rm(target, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[prepare-build] Could not fully clear ${dirName}: ${message}`);
  }
}

async function main() {
  await Promise.all(artifactDirs.map(removeDirIfExists));
}

main();
