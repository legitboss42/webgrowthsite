import { spawn } from "node:child_process";

const slug = process.argv[2];

if (!slug) {
  console.error("Missing article slug.");
  console.error("Example: node scripts/build-article-video.mjs 03-seo-migration-without-losing-traffic");
  process.exit(1);
}

const root = process.cwd();

function run(command, args) {
  const quoteArg = (value) =>
    /\s/.test(value) ? `"${String(value).replace(/"/g, '\\"')}"` : value;

  const commandLine = [command, ...args].map(quoteArg).join(" ");

  return new Promise((resolve, reject) => {
    const child =
      process.platform === "win32"
        ? spawn("cmd.exe", ["/d", "/s", "/c", commandLine], {
            cwd: root,
            stdio: "inherit",
          })
        : spawn(command, args, {
            cwd: root,
            shell: false,
            stdio: "inherit",
          });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${commandLine} failed with code ${code}`));
    });
  });
}

async function main() {
  console.log(`Preparing screenshots for: ${slug}`);
  await run("node", ["scripts/prepare-article-assets.mjs", slug]);

  console.log(`Rendering video for: ${slug}`);
  await run("node", ["scripts/render-article-video.mjs", slug]);

  console.log("");
  console.log("Done.");
  console.log(`Output: out/${slug}.mp4`);
}

await main();