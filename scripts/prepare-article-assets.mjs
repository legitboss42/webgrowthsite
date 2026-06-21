import fs from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import matter from "gray-matter";
import { chromium } from "playwright";

const slug = process.argv[2];

if (!slug) {
  console.error("Missing article slug.");
  console.error("Example: node scripts/prepare-article-assets.mjs 03-seo-migration-without-losing-traffic");
  process.exit(1);
}

const root = process.cwd();
const blogPath = path.join(root, "content", "blog", `${slug}.md`);
const assetDir = path.join(root, "public", "article-assets", slug);

const LOCAL_URL = process.env.WEBGROWTH_SCREENSHOT_URL || "http://localhost:3000";

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
      if (code === 0) resolve();
      else reject(new Error(`${commandLine} failed with code ${code}`));
    });
  });
}

async function waitForServer(url, timeoutMs = 30000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return;
    } catch {
      // keep waiting because apparently patience is now infrastructure
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error(`Local server did not respond at ${url}`);
}

function getPageTargets(data) {
  const primaryKeyword = String(data.primaryKeyword || "").toLowerCase();
  const category = String(data.category || "").toLowerCase();
  const title = String(data.title || "").toLowerCase();

  const targets = {
    hero: `/blog/${slug}`,
    problem: `/blog/${slug}`,
    solution: "/services/website-audit",
    result: "/services/business-website-design",
  };

  if (primaryKeyword.includes("seo") || title.includes("seo")) {
    targets.solution = "/services/search-engine-optimisation";
    targets.result = "/services/performance-optimisation";
  }

  if (primaryKeyword.includes("landing page") || title.includes("landing page")) {
    targets.solution = "/services/landing-page-design";
    targets.result = "/pricing";
  }

  if (primaryKeyword.includes("speed") || title.includes("speed")) {
    targets.solution = "/services/performance-optimisation";
    targets.result = "/website-speed-optimization-nigeria";
  }

  if (category.includes("case study") || title.includes("rebuilt")) {
    targets.solution = "/services/website-redesign";
    targets.result = "/portfolio";
  }

  return targets;
}

async function hideNoise(page) {
  await page.addStyleTag({
    content: `
      header,
      footer,
      nav,
      [data-hide-in-screenshot="true"],
      .cookie-banner,
      .fixed,
      .sticky {
        visibility: hidden !important;
      }

      body {
        background: #020403 !important;
      }
    `,
  });
}

async function screenshotPage(page, url, filePath, clipType) {
  await page.goto(url, {
    waitUntil: "networkidle",
    timeout: 60000,
  });

  await hideNoise(page);
  await page.waitForTimeout(800);

  if (clipType === "top") {
    await page.screenshot({
      path: filePath,
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1200,
      },
    });
    return;
  }

  if (clipType === "middle") {
    await page.evaluate(() => window.scrollTo(0, Math.floor(document.body.scrollHeight * 0.28)));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: filePath,
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1200,
      },
    });
    return;
  }

  if (clipType === "lower") {
    await page.evaluate(() => window.scrollTo(0, Math.floor(document.body.scrollHeight * 0.55)));
    await page.waitForTimeout(600);
    await page.screenshot({
      path: filePath,
      type: "png",
      clip: {
        x: 0,
        y: 0,
        width: 1080,
        height: 1200,
      },
    });
    return;
  }

  await page.screenshot({
    path: filePath,
    type: "png",
    fullPage: false,
  });
}

async function main() {
  const markdown = await fs.readFile(blogPath, "utf8");
  const { data } = matter(markdown);
  const targets = getPageTargets(data);

  await fs.mkdir(assetDir, { recursive: true });

  console.log("Starting local server...");
  const server =
    process.platform === "win32"
      ? spawn("cmd.exe", ["/d", "/s", "/c", "npm.cmd run dev"], {
          cwd: root,
          stdio: "inherit",
        })
      : spawn("npm", ["run", "dev"], {
          cwd: root,
          stdio: "inherit",
        });

  try {
    await waitForServer(LOCAL_URL);

    const browser = await chromium.launch({
      headless: true,
    });

    const page = await browser.newPage({
      viewport: {
        width: 1080,
        height: 1920,
      },
      deviceScaleFactor: 1,
    });

    const shots = [
      {
        name: "hero.png",
        path: targets.hero,
        clipType: "top",
      },
      {
        name: "problem.png",
        path: targets.problem,
        clipType: "middle",
      },
      {
        name: "solution.png",
        path: targets.solution,
        clipType: "top",
      },
      {
        name: "result.png",
        path: targets.result,
        clipType: "lower",
      },
    ];

    for (const shot of shots) {
      const url = `${LOCAL_URL}${shot.path}`;
      const outputPath = path.join(assetDir, shot.name);

      console.log(`Capturing ${shot.name}: ${url}`);
      await screenshotPage(page, url, outputPath, shot.clipType);
    }

    await browser.close();

    await fs.writeFile(
      path.join(assetDir, "manifest.json"),
      JSON.stringify(
        {
          slug,
          title: data.title || slug,
          source: LOCAL_URL,
          generatedAt: new Date().toISOString(),
          assets: shots.map((shot) => shot.name),
          targets,
        },
        null,
        2
      )
    );

    console.log(`Assets created: ${assetDir}`);
  } finally {
    server.kill();
  }
}

await main();