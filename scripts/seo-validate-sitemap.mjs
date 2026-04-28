import fs from "fs";
import path from "path";

const root = process.cwd();
const configPath = path.join(root, "src", "lib", "sitemap-config.json");
const baseUrl = process.env.SITEMAP_VALIDATE_BASE_URL || "http://127.0.0.1:3000";
const siteOrigin = "https://webgrowth.info";

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
const pageUrls = config.pagePaths.map((pagePath) => new URL(pagePath, siteOrigin).toString());
const blogUrls = config.blogSlugs.map((slug) => new URL(`/blog/${slug}/`, siteOrigin).toString());
const sitemapIndexUrl = new URL("/sitemap-index.xml", siteOrigin).toString();
const sitemapPagesUrl = new URL("/sitemap-pages.xml", siteOrigin).toString();
const sitemapBlogUrl = new URL("/sitemap-blog.xml", siteOrigin).toString();
const expectedIndexChildren = [sitemapPagesUrl, sitemapBlogUrl];

function mapToFetchUrl(expectedUrl) {
  const url = new URL(expectedUrl);
  return new URL(url.pathname + url.search, baseUrl).toString();
}

async function fetchManual(url) {
  return fetch(url, { redirect: "manual" });
}

function parseXmlLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1].trim());
}

function extractCanonical(html) {
  const patterns = [
    /<link[^>]+rel=["'][^"']*canonical[^"']*["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["'][^"']*canonical[^"']*["'][^>]*>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1].trim();
  }

  return null;
}

function containsNoindex(html, headers) {
  const robotsMeta =
    /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html) ||
    /<meta[^>]+content=["'][^"']*noindex[^"']*["'][^>]+name=["']robots["']/i.test(html);
  const xRobotsTag = headers.get("x-robots-tag");
  return robotsMeta || (typeof xRobotsTag === "string" && /noindex/i.test(xRobotsTag));
}

const failures = [];
const passed = [];

function pass(target, detail) {
  passed.push({ target, detail });
}

function fail(target, reason) {
  failures.push({ target, reason });
}

async function validateXmlEndpoint(name, expectedUrl, allowRedirectFromSlash = false) {
  const response = await fetchManual(mapToFetchUrl(expectedUrl));
  const contentType = response.headers.get("content-type") || "";

  if (response.status !== 200) {
    fail(name, `expected 200 for ${expectedUrl}, got ${response.status}`);
    return null;
  }

  if (!/xml/i.test(contentType)) {
    fail(name, `expected XML content-type for ${expectedUrl}, got ${contentType || "missing"}`);
    return null;
  }

  pass(name, `${expectedUrl} returned 200 XML`);

  if (allowRedirectFromSlash) {
    const slashResponse = await fetchManual(`${mapToFetchUrl(expectedUrl)}/`);
    const location = slashResponse.headers.get("location") || "";

    if (slashResponse.status === 200) {
      const slashContentType = slashResponse.headers.get("content-type") || "";
      if (!/xml/i.test(slashContentType)) {
        fail(`${name} slash`, `expected XML for ${expectedUrl}/, got ${slashContentType || "missing"}`);
      } else {
        pass(`${name} slash`, `${expectedUrl}/ returned 200 XML`);
      }
    } else if (slashResponse.status >= 300 && slashResponse.status < 400) {
      const expectedPathname = new URL(expectedUrl).pathname;
      const expectedLocation = new URL(expectedPathname, baseUrl).toString();
      const normalizedLocation = location
        ? new URL(location, baseUrl).toString()
        : "";
      if (normalizedLocation !== expectedLocation) {
        fail(`${name} slash`, `expected redirect to ${expectedLocation}, got ${location || "missing location"}`);
      } else {
        pass(`${name} slash`, `${expectedUrl}/ redirected cleanly`);
      }
    } else {
      fail(`${name} slash`, `expected 200 or redirect for ${expectedUrl}/, got ${slashResponse.status}`);
    }
  }

  return response.text();
}

async function validatePage(expectedUrl) {
  const response = await fetchManual(mapToFetchUrl(expectedUrl));

  if (response.status !== 200) {
    fail(expectedUrl, `expected 200, got ${response.status}`);
    return;
  }

  const html = await response.text();
  const canonical = extractCanonical(html);

  if (!canonical) {
    fail(expectedUrl, "missing canonical tag");
    return;
  }

  if (canonical !== expectedUrl) {
    fail(expectedUrl, `canonical mismatch: expected ${expectedUrl}, got ${canonical}`);
    return;
  }

  if (containsNoindex(html, response.headers)) {
    fail(expectedUrl, "contains noindex");
    return;
  }

  pass(expectedUrl, "200, canonical matched, no noindex");
}

async function main() {
  const indexXml = await validateXmlEndpoint("sitemap-index", sitemapIndexUrl, true);
  const pagesXml = await validateXmlEndpoint("sitemap-pages", sitemapPagesUrl, true);
  const blogXml = await validateXmlEndpoint("sitemap-blog", sitemapBlogUrl, true);

  if (indexXml) {
    const locs = parseXmlLocs(await indexXml);
    if (JSON.stringify(locs) !== JSON.stringify(expectedIndexChildren)) {
      fail("sitemap-index", `expected children ${expectedIndexChildren.join(", ")}, got ${locs.join(", ")}`);
    }
  }

  if (pagesXml) {
    const locs = parseXmlLocs(await pagesXml);
    const duplicateLocs = locs.filter((url, index) => locs.indexOf(url) !== index);
    if (duplicateLocs.length) {
      fail("sitemap-pages", `duplicate URLs found: ${duplicateLocs.join(", ")}`);
    }
    if (locs.some((url) => /\/home\/?$/i.test(url))) {
      fail("sitemap-pages", "contains /home or /home/");
    }
    if (locs.some((url) => /\/sitemap(?:-index|-pages|-blog)?\.xml\/?$/i.test(url))) {
      fail("sitemap-pages", "contains sitemap XML URL as page URL");
    }
    if (JSON.stringify(locs) !== JSON.stringify(pageUrls)) {
      fail("sitemap-pages", "page URL list does not match expected allowlist");
    }
  }

  if (blogXml) {
    const locs = parseXmlLocs(await blogXml);
    const duplicateLocs = locs.filter((url, index) => locs.indexOf(url) !== index);
    if (duplicateLocs.length) {
      fail("sitemap-blog", `duplicate URLs found: ${duplicateLocs.join(", ")}`);
    }
    if (locs.some((url) => /\/home\/?$/i.test(url))) {
      fail("sitemap-blog", "contains /home or /home/");
    }
    if (locs.some((url) => /\/sitemap(?:-index|-pages|-blog)?\.xml\/?$/i.test(url))) {
      fail("sitemap-blog", "contains sitemap XML URL as page URL");
    }
    if (JSON.stringify(locs) !== JSON.stringify(blogUrls)) {
      fail("sitemap-blog", "blog URL list does not match expected allowlist");
    }
  }

  const combinedUrls = [...pageUrls, ...blogUrls];
  const duplicateCombinedUrls = combinedUrls.filter(
    (url, index) => combinedUrls.indexOf(url) !== index
  );
  if (duplicateCombinedUrls.length) {
    fail("combined", `duplicate URLs across sitemaps: ${duplicateCombinedUrls.join(", ")}`);
  }

  for (const expectedUrl of combinedUrls) {
    await validatePage(expectedUrl);
  }

  console.log("Passed URLs:");
  for (const item of passed) {
    console.log(`PASS ${item.target} - ${item.detail}`);
  }

  console.log("Failed URLs:");
  if (!failures.length) {
    console.log("None");
  } else {
    for (const item of failures) {
      console.log(`FAIL ${item.target} - ${item.reason}`);
    }
  }

  if (failures.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Sitemap SEO validation failed unexpectedly.");
  console.error(error);
  process.exit(1);
});
