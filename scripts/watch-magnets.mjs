import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const magnetsDir = path.join(rootDir, "content", "magnets");

fs.mkdirSync(magnetsDir, { recursive: true });

let debounceTimer = null;
let buildRunning = false;
let buildQueued = false;

function runBuild() {
  if (buildRunning) {
    buildQueued = true;
    return;
  }

  buildRunning = true;
  const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";

  const child = spawn(npmCmd, ["run", "magnets:build"], {
    cwd: rootDir,
    stdio: "inherit",
  });

  child.on("exit", (code) => {
    buildRunning = false;

    if (buildQueued) {
      buildQueued = false;
      runBuild();
      return;
    }

    if (code && code !== 0) {
      console.log(`[magnets] build exited with code ${code}`);
    }
  });
}

function scheduleBuild() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => runBuild(), 200);
}

console.log(`[magnets] Watching ${path.relative(rootDir, magnetsDir)}...`);
runBuild();

const watcher = fs.watch(magnetsDir, { persistent: true }, (eventType, filename) => {
  const name = filename?.toString() ?? "";
  if (name && !name.toLowerCase().endsWith(".md")) return;

  console.log(`[magnets] change detected (${eventType}${name ? `: ${name}` : ""})`);
  scheduleBuild();
});

process.on("SIGINT", () => {
  watcher.close();
  process.exit(0);
});

