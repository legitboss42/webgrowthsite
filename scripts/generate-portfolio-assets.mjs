import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

const rawDir = path.join(repoRoot, "public", "images", "portfolio", "raw");
const outputDir = path.join(repoRoot, "public", "images", "portfolio");
const reportPath = path.join(__dirname, "portfolio-inspection-report.json");

const projects = [
  { slug: "base-yield", url: "https://base-yield-eight.vercel.app/" },
  { slug: "treats-by-ann", url: "https://treats-by-ann.vercel.app/" },
  { slug: "i-fitness", url: "https://i-fitness-preview.vercel.app/" },
  { slug: "tlc-interiors", url: "https://tlc-interiors-limited.vercel.app/" },
  { slug: "jluxe", url: "https://www.jluxemedicalaesthetics.com/" },
] ;

const viewports = [
  { key: "desktop", width: 1440, height: 1080 },
  { key: "tablet", width: 834, height: 1112 },
  { key: "mobile", width: 390, height: 844 },
];

function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

async function ensureDirs() {
  await fs.mkdir(rawDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
}

async function dismissCommonUi(page) {
  const candidates = [
    "Accept",
    "Accept all",
    "Accept All",
    "I agree",
    "Got it",
    "Close",
    "No thanks",
  ];

  for (const label of candidates) {
    const locator = page.getByRole("button", { name: label }).first();
    try {
      if (await locator.isVisible({ timeout: 800 })) {
        await locator.click({ timeout: 800 });
      }
    } catch {}
  }
}

async function extractSiteData(page, url) {
  return page.evaluate((pageUrl) => {
    const clean = (value) =>
      String(value || "")
        .replace(/\s+/g, " ")
        .replace(/\u00a0/g, " ")
        .trim();

    const collect = (selector, limit = 10) =>
      Array.from(document.querySelectorAll(selector))
        .map((node) => clean(node.textContent))
        .filter(Boolean)
        .filter((text, index, arr) => arr.indexOf(text) === index)
        .slice(0, limit);

    const firstParagraphs = Array.from(document.querySelectorAll("main p, section p, p"))
      .map((node) => clean(node.textContent))
      .filter((text) => text.length > 40)
      .filter((text, index, arr) => arr.indexOf(text) === index)
      .slice(0, 6);

    return {
      inspectedUrl: pageUrl,
      finalUrl: window.location.href,
      title: clean(document.title),
      metaDescription: clean(
        document.querySelector('meta[name="description"]')?.getAttribute("content")
      ),
      h1: collect("h1", 4),
      nav: collect("nav a, nav button", 12),
      headings: collect("h2, h3", 14),
      paragraphs: firstParagraphs,
    };
  }, url);
}

function shadowSvg(width, height, radius = 30, opacity = 0.28) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="18" y="20" width="${width - 36}" height="${height - 36}" rx="${radius}" fill="rgba(0,0,0,${opacity})"/>
    </svg>
  `);
}

function frameSvg(width, height, radius = 26) {
  return Buffer.from(`
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0.75" y="0.75" width="${width - 1.5}" height="${height - 1.5}" rx="${radius}" stroke="rgba(255,255,255,0.18)" stroke-width="1.5"/>
    </svg>
  `);
}

function badgeSvg(label) {
  return Buffer.from(`
    <svg width="170" height="38" viewBox="0 0 170 38" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="170" height="38" rx="19" fill="rgba(6,12,10,0.78)" stroke="rgba(255,255,255,0.14)"/>
      <text x="85" y="23" fill="rgba(216,245,232,0.92)" font-family="Arial, sans-serif" font-size="12" text-anchor="middle" letter-spacing="1.6">${label}</text>
    </svg>
  `);
}

async function framedScreenshot(inputPath, width, height) {
  const screenshot = sharp(inputPath);
  const resized = await screenshot
    .resize({
      width: width - 28,
      height: height - 28,
      fit: "cover",
      position: "top",
    })
    .toBuffer();

  const frame = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#090d0b",
    },
  })
    .composite([
      { input: resized, top: 14, left: 14 },
      { input: frameSvg(width, height) },
    ])
    .png()
    .toBuffer();

  return { buffer: frame };
}

async function createComposite(slug) {
  const canvasWidth = 1600;
  const canvasHeight = 1200;
  const background = Buffer.from(`
    <svg width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="#050806"/>
      <rect width="${canvasWidth}" height="${canvasHeight}" fill="url(#bg)"/>
      <circle cx="280" cy="220" r="280" fill="rgba(16,185,129,0.12)"/>
      <circle cx="1280" cy="960" r="340" fill="rgba(16,185,129,0.08)"/>
      <g opacity="0.16">
        <path d="M0 80H1600" stroke="rgba(255,255,255,0.08)"/>
        <path d="M0 220H1600" stroke="rgba(255,255,255,0.06)"/>
        <path d="M0 360H1600" stroke="rgba(255,255,255,0.05)"/>
        <path d="M0 500H1600" stroke="rgba(255,255,255,0.05)"/>
      </g>
      <defs>
        <linearGradient id="bg" x1="120" y1="90" x2="1460" y2="1100" gradientUnits="userSpaceOnUse">
          <stop stop-color="#0A1510"/>
          <stop offset="0.52" stop-color="#070B09"/>
          <stop offset="1" stop-color="#030504"/>
        </linearGradient>
      </defs>
    </svg>
  `);

  const desktop = await framedScreenshot(path.join(rawDir, `${slug}-desktop.png`), 1040, 660);
  const tablet = await framedScreenshot(path.join(rawDir, `${slug}-tablet.png`), 360, 500);
  const mobile = await framedScreenshot(path.join(rawDir, `${slug}-mobile.png`), 240, 470);

  const composite = sharp(background)
    .composite([
      { input: shadowSvg(1060, 680), left: 80, top: 130 },
      { input: desktop.buffer, left: 90, top: 120 },
      { input: shadowSvg(380, 520, 30, 0.24), left: 980, top: 260 },
      { input: tablet.buffer, left: 990, top: 250 },
      { input: shadowSvg(260, 490, 30, 0.26), left: 1180, top: 470 },
      { input: mobile.buffer, left: 1190, top: 460 },
      { input: badgeSvg("Desktop"), left: 126, top: 742 },
      { input: badgeSvg("Tablet"), left: 1088, top: 690 },
      { input: badgeSvg("Mobile"), left: 1207, top: 940 },
    ])
    .webp({ quality: 88 });

  await composite.toFile(path.join(outputDir, `${slug}-cover.webp`));
}

async function captureProject(browser, project) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1080 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  page.setDefaultTimeout(20000);

  await page.goto(project.url, { waitUntil: "domcontentloaded", timeout: 30000 });
  try {
    await page.waitForLoadState("networkidle", { timeout: 12000 });
  } catch {}

  await dismissCommonUi(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1200);

  const details = await extractSiteData(page, project.url);

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.evaluate(() => window.scrollTo(0, 0));
    try {
      await page.waitForLoadState("networkidle", { timeout: 5000 });
    } catch {}
    await page.waitForTimeout(700);
    await page.screenshot({
      path: path.join(rawDir, `${project.slug}-${viewport.key}.png`),
      fullPage: false,
      type: "png",
    });
  }

  await context.close();
  await createComposite(project.slug);

  return {
    slug: project.slug,
    url: project.url,
    ...details,
    rawScreenshots: viewports.map((viewport) => `/images/portfolio/raw/${project.slug}-${viewport.key}.png`),
    coverImage: `/images/portfolio/${project.slug}-cover.webp`,
  };
}

async function main() {
  await ensureDirs();
  const browser = await chromium.launch({ headless: true });

  try {
    const results = [];
    for (const project of projects) {
      console.log(`Capturing ${project.slug}...`);
      const result = await captureProject(browser, project);
      results.push(result);
    }

    await fs.writeFile(reportPath, `${JSON.stringify(results, null, 2)}\n`, "utf8");
    console.log(`Saved inspection report to ${reportPath}`);
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
