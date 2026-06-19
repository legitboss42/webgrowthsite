# WebGrowth.info AdSense, SEO, and AEO Readiness Audit

Date: 2026-06-18  
Target: https://webgrowth.info  
Stack verified: Next.js + Tailwind CSS

## Evidence Used

- Live homepage HTML and rendered checks for desktop/mobile.
- Live `robots.txt`, `sitemap-index.xml`, `sitemap-pages.xml`, and `sitemap-blog.xml`.
- Local route inventory from `src/app`.
- Local project checks: `npm.cmd run seo:validate`, `node scripts/validate-sitemap.mjs`, and `npm.cmd run build`.
- Blog metadata/content checks for the 12 sitemap-approved posts.

Analytics, Search Console coverage, real traffic quality, backlink data, and AdSense account history were not available. Any approval probability below is an estimate based on visible signals only.

## Website Quality

The core visible site is professionally built, mobile-responsive in sampled rendering, and has a clear commercial purpose. Priority pages have one H1, self-referencing canonicals, index/follow robots tags, structured metadata, and strong internal linking. Rendered checks on the homepage, a blog post, a core service page, and contact page found no visible `Loading` text and no horizontal overflow on desktop or mobile.

The biggest quality problem is route hygiene. Several old or transitional routes are live as `200` HTML pages even though their source files use `permanentRedirect()`. On production, these are not behaving as HTTP redirects:

- `/domain-offer/`
- `/google-business-profile-optimization-lagos/`
- `/landing-page-design-lagos/`
- `/website-redesign-lagos/`
- `/website-speed-optimization-nigeria/`

These pages have no H1, about 128 words of rendered text, are indexable, and canonicalize to the homepage. This is a high-risk low-value URL pattern for AdSense and SEO.

Post-audit source remediation: `middleware.ts` and `next.config.mjs` were updated to redirect these five legacy URLs to their intended destination routes. A local production-server smoke test confirmed `308 Permanent Redirect` responses. This still needs deployment before the live production finding is resolved.

Policy vs best practice:

- Google/AdSense policy requirement: the site must provide original, useful content and avoid low-value or misleading pages.
- SEO best practice: redirected URLs should return a real 301/308 response, not a thin 200 page with a homepage canonical.
- Conversion best practice: old campaign URLs should land users on the intended active offer or service without confusion.

## Content Quality

The 12 blog URLs in the sitemap are not thin by visible word count. Markdown body counts range from 832 to 1,381 words, and rendered pages are roughly 1,665 to 2,230 words because of author, reviewer, FAQ, related guide, and template blocks. Every approved blog post has author, reviewer, updated/reviewed dates, key takeaways, common mistakes, steps, FAQ entries, and related guide links.

Visible weaknesses:

- Most approved posts have no in-article images.
- Most approved posts have no external authority references.
- Several posts are close in topic around conversion, landing pages, service pages, and redesigns, so cannibalization should be watched.
- The blog hub is indexable but excluded from the sitemap.

Policy vs best practice:

- Google/AdSense policy requirement: do not publish scraped, copied, spun, or auto-generated low-value content. I could not verify plagiarism/originality from local evidence alone.
- SEO best practice: add selective authoritative references and examples where claims would benefit from support.
- AEO/GEO best practice: keep concise direct-answer sections, FAQs, comparison blocks, and entity clarity, but do not over-format every article into the same pattern.

## Traffic Quality

Traffic quality cannot be verified from this environment. GA4, Google Search Console, and AdSense data were not connected. The Rube/Composio Google Analytics tool required by `google-analytics-automation` is not available in this session.

Visible tracking setup includes GTM, optional GA via `NEXT_PUBLIC_GA_ID`, TikTok pixel, Vercel Analytics, Vercel Speed Insights, and optional Microsoft Clarity. Rendered checks showed console noise from CSP report-only behavior and analytics fetch restrictions, but that is not enough to prove tracking is broken.

Traffic-quality checks still required before applying:

- Verify organic, direct, referral, and paid/social source quality in GA4.
- Check for suspicious direct spikes, bot-like sessions, low engagement bursts, and spam referrals.
- Confirm no traffic exchange, paid bot traffic, or incentivized clicks.
- Confirm conversions/key events represent real enquiry actions, not page views or low-intent button clicks.

Policy vs best practice:

- Google/AdSense policy requirement: avoid invalid traffic and any behavior that could inflate ad impressions or clicks.
- Analytics best practice: do not optimize or apply based on unvalidated GA4 data.

## Policy Risks

High-risk issues before AdSense application:

1. Indexable stub/redirect pages returning `200` instead of real redirects.
2. Multiple live, indexable pages outside the sitemap without a clear indexation decision.
3. Offer/affiliate-style pages such as `/hosting-offer/` should not carry ads and should be reviewed for commercial-content balance.
4. Utility/thank-you pages should remain noindex and should never contain ads.

Moderate risks:

- FAQPage schema is used on many commercial pages. This is not an AdSense policy issue, but Google rich-result eligibility for FAQ is restricted mostly to government/health authority contexts. Keep visible FAQs for users, but do not treat FAQ schema as a Google rich-result strategy.
- Schema should be audited so every `sameAs`, price, offer, service area, and contact claim is verifiable.

No evidence found in this pass of:

- Unsafe downloads.
- Excessive ads.
- Intrusive popups.
- Copyrighted media misuse.
- Fake reviews or aggregate ratings in the validated priority page source.

## Trust & E-E-A-T

Strengths:

- About, Contact, Privacy Policy, Terms, and Editorial Policy exist.
- Blog posts include author and reviewer signals.
- The site uses HTTPS and strong security headers.
- Contact information and WhatsApp path are visible.
- Portfolio and pricing pages support trust and commercial transparency.

Gaps:

- Privacy, Terms, Editorial Policy, and Blog hub are indexable but excluded from the sitemap.
- Editorial Policy is short at roughly 323 words in the crawl output; it should be more robust before AdSense review.
- Social profile links in schema should be manually verified before relying on them as `sameAs` authority signals.
- Portfolio/case study claims should remain factual and avoid unverifiable performance claims.

Policy vs best practice:

- Google/AdSense policy requirement: clear navigation and sufficient site transparency are important for approval quality review.
- SEO best practice: stronger author/entity consistency helps trust evaluation, especially for advice content.
- Personal recommendation: expand the Editorial Policy and link it from article author/reviewer blocks and footer consistently.

## SEO & Indexing

Verified strengths:

- `robots.txt` returns 200 and allows normal crawling while blocking `/api/`, thank-you paths, and `/mockup`.
- Sitemap index returns 200 and references page and blog sitemaps.
- Local SEO validation passed: 10 priority pages, 16 sitemap page URLs, 12 sitemap blog URLs.
- Production build passed and generated 67 routes.
- Priority pages use index/follow, canonical URLs, titles, descriptions, H1s, and JSON-LD.

Main issue:

There is a mismatch between generated route surface and intentional indexation. The app builds 67 routes, while the sitemap contains 28 content URLs. Not every generated route must be indexed, but every live indexable route needs an explicit decision.

Route decisions:

| Route group | Decision | Reason |
|---|---|---|
| Core sitemap pages | Keep indexed | Strongest site/business pages and already in sitemap. |
| 12 sitemap blog posts | Keep indexed, improve | Good structure and depth; add selective images/references and watch cannibalization. |
| `/blog/` | Add to sitemap | It is an indexable content hub and should support blog discovery. |
| `/privacy/`, `/terms/`, `/editorial-policy/` | Add to sitemap or keep strongly linked | Trust pages help AdSense review; sitemap inclusion is a best practice, not a policy requirement. |
| `/domain-offer/`, `/google-business-profile-optimization-lagos/`, `/landing-page-design-lagos/`, `/website-redesign-lagos/`, `/website-speed-optimization-nigeria/` | Fix as server redirects | Current production behavior is indexable thin 200 pages. |
| Unsitemap service pages under `/services/*` | Improve and include, or noindex | They are indexable and mostly 900-1,165 rendered words; if they are active services, include them after uniqueness review. |
| `/hosting-offer/`, `/launch/`, `/website-build/` | Keep only if strategically needed; no ads | Commercial/offer pages should not be used as ad inventory. |
| `/thank-you/`, `/contact/thanks/`, `/mockup/` | Keep noindex | Utility/private-intent pages should not be indexed or monetized. |
| API routes | Keep blocked/no public indexing | Correct for non-content endpoints. |

## Approval Readiness Score

- Probability: 55-65% estimate based on visible signals only.
- Strengths: strong core page quality, legal/trust pages exist, sitemap/robots work, 12 decent blog posts, no ads currently visible, build and SEO validation pass.
- Risks: indexable stub redirect pages, sitemap/indexable route mismatch, unverified traffic quality, offer/affiliate-style pages needing ad exclusion, limited external references in blog content.
- Critical Fixes: repair legacy redirects, explicitly decide index/noindex/include for every live route, strengthen trust/editorial pages, verify GA4/GSC traffic quality before applying.

Estimated visible-only SEO Health Index: 74/100, Fair.

Score limits:

- Crawlability & Indexation: 70/100 due to indexable stub routes and sitemap mismatch.
- Technical Foundations: 82/100 due to good build/security/mobile checks but unavailable PSI data and CSP/analytics console noise.
- On-Page Optimization: 78/100 due to strong priority pages but weak stub routes.
- Content Quality & E-E-A-T: 72/100 due to decent blogs and trust blocks but limited references and thin editorial policy.
- Authority & Trust Signals: 68/100 due to visible trust pages but unverified social/entity signals and no external authority data.

## First-Attempt Approval Roadmap

1. Immediate fixes
   - Deploy the source fix that moves broken redirect routes into `middleware.ts` and `next.config.mjs`, then verify they return 308/301 on production.
   - Add `/blog/`, `/privacy/`, `/terms/`, and `/editorial-policy/` to sitemap if they remain indexable.
   - Decide index/noindex for every live route not in the sitemap.

2. Pages to improve
   - Expand `/editorial-policy/` with review process, correction policy, update standards, author/reviewer accountability, and source standards.
   - Improve `/contact/` content depth modestly if it remains under 500 rendered words.
   - Review all unsitemap service pages for unique value, examples, FAQs, and internal links.

3. Pages to remove or noindex
   - Noindex or remove any active page that exists only for campaigns, thin offers, or redirects.
   - Keep thank-you, mockup, and private/utility pages out of the index.

4. Content improvements
   - Add one useful original visual or example to the 11 blog posts with no in-article images.
   - Add relevant external references only where claims need support.
   - Create a cannibalization map for conversion/service-page/redesign posts.

5. Trust improvements
   - Verify schema social `sameAs` links.
   - Make author/reviewer profile details more visible from blog templates.
   - Keep pricing, portfolio, contact, and editorial standards easy to reach from navigation/footer.

6. Technical SEO fixes
   - Re-run live crawl after redirect fixes.
   - Re-run PageSpeed Insights or Lighthouse when rate limiting clears.
   - Consider moving CSP from report-only to enforced only after analytics/script issues are resolved.

7. Traffic quality recommendations
   - Connect GA4/GSC or export reports before applying.
   - Confirm there is no suspicious direct/referral/social traffic pattern.
   - Confirm key events track real form submissions or meaningful enquiries.

8. Safe monetization structure
   - Do not place ads on homepage hero, contact, pricing, portfolio, offer, thank-you, mockup, or thin utility pages.
   - Start with restrained in-content placements on substantial blog posts only.
   - Keep ads away from CTAs, forms, buttons, navigation, and downloadable resources.
   - Avoid sticky, deceptive, or layout-shifting ad units.

9. Best application timing
   - Wait until redirect stubs are fixed, route indexation is reconciled, trust pages are strengthened, and traffic quality is verified.
   - After fixes, let the live site settle and re-crawl key URLs before applying.

## Final Verdict

WAIT AND IMPROVE

The site has a strong enough foundation that this is not a hopeless AdSense case. But applying now would be unnecessarily risky because Google can discover indexable low-value redirect/stub pages and an unclear live-route indexation strategy. Fix those first, then re-run the audit.
