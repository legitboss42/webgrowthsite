import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const schedulerPage = new URL("../../app/scheduler/page.tsx", import.meta.url);
const signInPage = new URL("../../app/scheduler/sign-in/page.tsx", import.meta.url);
const termsPage = new URL("../../app/scheduler/terms/page.tsx", import.meta.url);
const schedulerLayout = new URL("../../app/scheduler/layout.tsx", import.meta.url);
const routeGovernance = new URL("../route-governance.json", import.meta.url);

function balancedBlock(source: string, openAt: number, open: string, close: string) {
  let depth = 0;
  for (let index = openAt; index < source.length; index += 1) {
    if (source[index] === open) depth += 1;
    if (source[index] === close) {
      depth -= 1;
      if (depth === 0) return source.slice(openAt, index + 1);
    }
  }
  throw new Error(`Unclosed ${open}${close} block.`);
}

function ternaryBranches(source: string, condition: string) {
  const expression = new RegExp(`\\{${condition.replaceAll(".", "\\.")}\\s*\\?\\s*\\(`);
  const match = expression.exec(source);
  assert.ok(match?.index !== undefined, `missing ${condition} ternary`);

  const truthyStart = source.indexOf("(", match.index + match[0].length - 1);
  const truthy = balancedBlock(source, truthyStart, "(", ")");
  const afterTruthy = source.slice(truthyStart + truthy.length);
  const falsyMatch = /^\s*:\s*\(/.exec(afterTruthy);
  assert.ok(falsyMatch, `missing ${condition} false branch`);
  const falsyStart = truthyStart + truthy.length + falsyMatch[0].lastIndexOf("(");

  return { truthy, falsy: balancedBlock(source, falsyStart, "(", ")") };
}

function metadataBlock(source: string) {
  const marker = "export const metadata: Metadata = ";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "metadata export is missing");
  const openAt = source.indexOf("{", start + marker.length);
  return balancedBlock(source, openAt, "{", "}");
}

function assertPublicMetadata(source: string, canonical: string) {
  const metadata = metadataBlock(source);
  assert.match(metadata, new RegExp(`canonical:\\s*"${canonical.replace(/[/.?]/g, "\\$&")}"`));
  assert.match(metadata, /robots:\s*\{\s*index:\s*true,\s*follow:\s*true\s*\}/);
}

function declarationArray(source: string, name: string) {
  const marker = `const ${name} = `;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${name} declaration is missing`);
  const openAt = source.indexOf("[", start + marker.length);
  return balancedBlock(source, openAt, "[", "]");
}

function renderedMap(source: string, collection: string) {
  const marker = `{${collection}.map(`;
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `${collection} is not rendered with map`);
  const openAt = source.indexOf("(", start + marker.length - 1);
  return balancedBlock(source, openAt, "(", ")");
}

test("closed sign-in branch explains approval and cannot initiate TikTok OAuth", async () => {
  const source = await readFile(signInPage, "utf8");
  const { falsy: closed } = ternaryBranches(source, "launch.publicEnrollment");

  assert.match(closed, /TikTok access opening after approval/);
  assert.doesNotMatch(closed, /\/api\/scheduler\/auth\/authorize/);
  assert.doesNotMatch(closed, /Continue with TikTok/);
});

test("open sign-in branch links the exact TikTok CTA to scheduler authorization", async () => {
  const source = await readFile(signInPage, "utf8");
  const { truthy: open } = ternaryBranches(source, "launch.publicEnrollment");

  assert.match(open, /href="\/api\/scheduler\/auth\/authorize\/\?mode=login&returnTo=\/scheduler\/dashboard\/"/);
  assert.match(open, />\s*Continue with TikTok\s*</);
});

test("landing enrollment CTA switches from terms to sign-in across launch branches", async () => {
  const source = await readFile(schedulerPage, "utf8");
  const { truthy: open, falsy: closed } = ternaryBranches(source, "launch.publicEnrollment");

  assert.match(closed, /href="\/scheduler\/terms\/"/);
  assert.match(closed, />\s*TikTok access opening after approval\s*</);
  assert.doesNotMatch(closed, /\/scheduler\/sign-in\/|Continue with TikTok/);
  assert.match(open, /href="\/scheduler\/sign-in\/"/);
  assert.match(open, />\s*Continue with TikTok\s*</);
  assert.doesNotMatch(open, /TikTok access opening after approval/);
});

test("landing separates public visibility from Direct Post availability", async () => {
  const source = await readFile(schedulerPage, "utf8");
  const note = /const publicPostingNote\s*=\s*([\s\S]*?);\r?\n/.exec(source)?.[1];

  assert.ok(note, "public-posting note is missing");
  assert.match(note, /^launch\.publicPosting\s*\?/);
  assert.doesNotMatch(note, /directPost/);
  assert.doesNotMatch(source, /launch\.directPost/);
  assert.match(source, /<dd[^>]*>\{publicPostingNote\}<\/dd>/);
});

test("public scheduler metadata is canonical and sign-in remains noindex", async () => {
  const [landing, terms, signIn] = await Promise.all([
    readFile(schedulerPage, "utf8"),
    readFile(termsPage, "utf8"),
    readFile(signInPage, "utf8"),
  ]);

  assertPublicMetadata(landing, "https://webgrowth.info/scheduler/");
  assertPublicMetadata(terms, "https://webgrowth.info/scheduler/terms/");
  assert.match(metadataBlock(signIn), /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
});

test("scheduler governance classifies public, sign-in, and terms routes exactly", async () => {
  const governance = JSON.parse(await readFile(routeGovernance, "utf8")) as {
    routes: Array<{ path: string; status: string; sitemap: boolean }>;
  };
  const route = (path: string) => governance.routes.find((entry) => entry.path === path);

  assert.deepEqual(route("/scheduler/"), {
    path: "/scheduler/",
    status: "INDEX",
    sitemap: true,
    reason: "Public TikTok scheduler product and rollout page",
  });
  assert.deepEqual(route("/scheduler/sign-in/"), {
    path: "/scheduler/sign-in/",
    status: "NOINDEX",
    sitemap: false,
    reason: "TikTok scheduler sign-in",
  });
  assert.deepEqual(route("/scheduler/terms/"), {
    path: "/scheduler/terms/",
    status: "INDEX",
    sitemap: true,
    reason: "Public TikTok scheduler terms and privacy summary",
  });
});

test("scheduler layout renders the public Terms link in its navigation", async () => {
  const source = await readFile(schedulerLayout, "utf8");
  const navStart = source.indexOf('<nav aria-label="Scheduler"');
  assert.notEqual(navStart, -1, "scheduler navigation is missing");
  const nav = source.slice(navStart, source.indexOf("</nav>", navStart) + "</nav>".length);

  assert.match(nav, /<Link[^>]*href="\/scheduler\/terms\/"[^>]*>Terms<\/Link>/);
});

test("scheduler terms render creator, retention, account-control, and provider disclosures", async () => {
  const source = await readFile(termsPage, "utf8");
  const disclosures = declarationArray(source, "sections");
  const renderedDisclosures = renderedMap(source, "sections");
  const returnStart = source.indexOf("return (");
  assert.notEqual(returnStart, -1, "terms return markup is missing");
  const renderedTerms = source.slice(returnStart);

  assert.match(disclosures, /TikTok-only authentication/);
  assert.match(disclosures, /seven days after publication, cancellation, or terminal failure/i);
  assert.match(disclosures, /You remain responsible for captions, disclosures, rights, audience choices/i);
  assert.match(disclosures, /not endorsed by TikTok or Google/i);
  assert.match(disclosures, /account controls or support/i);
  assert.match(renderedDisclosures, /section\.body/);
  assert.match(renderedTerms, /Terms version\s*\{CURRENT_SCHEDULER_TERMS_VERSION\}\s*·\s*Privacy version\s*\{CURRENT_SCHEDULER_PRIVACY_VERSION\}/);
  assert.match(source, /CURRENT_SCHEDULER_TERMS_VERSION/);
  assert.match(source, /CURRENT_SCHEDULER_PRIVACY_VERSION/);
});
