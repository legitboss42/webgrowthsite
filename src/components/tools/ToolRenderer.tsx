"use client";

import { useMemo, useState } from "react";
import PremiumButton from "@/components/platform/PremiumButton";
import type { PublicToolSlug } from "@/lib/tools";

type PageAuditResult = {
  url: string;
  score: number;
  title: string;
  titleLength: number;
  metaDescription: string;
  metaDescriptionLength: number;
  h1s: string[];
  headingCount: {
    h1: number;
    h2: number;
  };
  wordCount: number;
  ctas: string[];
  trustTargets: Record<string, boolean>;
  imageCount: number;
  imagesMissingAlt: number;
  proofMentions: number;
  issues: Array<{
    severity: "high" | "medium" | "low";
    message: string;
  }>;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="tool-field-label text-sm font-semibold text-slate-900">{children}</label>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "tool-control min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition",
        "focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "tool-control w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-7 text-slate-900 shadow-sm outline-none transition",
        "focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "tool-control min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-900 shadow-sm outline-none transition",
        "focus:border-blue-300 focus:ring-2 focus:ring-blue-100",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Card({
  title,
  children,
  tone = "white",
}: {
  title?: string;
  children: React.ReactNode;
  tone?: "white" | "tint" | "dark";
}) {
  const toneClass =
    tone === "dark"
      ? "border-blue-950/60 bg-[radial-gradient(circle_at_88%_14%,rgba(28,122,84,0.36),transparent_24%),linear-gradient(135deg,#0c3327_0%,#0e1a14_48%,#0c3327_100%)] text-white"
      : tone === "tint"
        ? "border-blue-100 bg-[linear-gradient(180deg,#ffffff_0%,#f7f8f4_100%)]"
        : "border-slate-200 bg-white";

  return (
    <section className={["tool-renderer-card rounded-[1.8rem] border p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]", toneClass].join(" ")}>
      {title ? <h2 className="text-2xl font-semibold tracking-[-0.03em]">{title}</h2> : null}
      <div className={title ? "mt-5" : ""}>{children}</div>
    </section>
  );
}

function CopyButton({ text, label = "Copy summary" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="tool-copy-button inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
    >
      {copied ? "Copied" : label}
    </button>
  );
}

function buildAuditSummary(result: PageAuditResult, mode: "homepage" | "adsense") {
  const issueLines = result.issues.map((issue) => `- [${issue.severity}] ${issue.message}`).join("\n");
  return [
    `${mode === "homepage" ? "Homepage" : "AdSense"} review for ${result.url}`,
    `Score: ${result.score}%`,
    `Title: ${result.title || "Missing"} (${result.titleLength})`,
    `Meta description length: ${result.metaDescriptionLength}`,
    `H1 count: ${result.headingCount.h1}`,
    `H2 count: ${result.headingCount.h2}`,
    `Word count: ${result.wordCount}`,
    `CTA count detected: ${result.ctas.length}`,
    `Proof mentions: ${result.proofMentions}`,
    `Images missing alt: ${result.imagesMissingAlt}`,
    "",
    "Issues:",
    issueLines || "- No issues detected.",
  ].join("\n");
}

function UrlAuditTool({
  mode,
  title,
  description,
}: {
  mode: "homepage" | "adsense";
  title: string;
  description: string;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<PageAuditResult | null>(null);

  async function handleAnalyze() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/tools/page-audit/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, mode }),
      });

      const data = (await response.json()) as PageAuditResult & { error?: string };
      if (!response.ok) {
        setError(data.error || "Analysis failed.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Unable to analyze this page right now.");
    } finally {
      setLoading(false);
    }
  }

  const summary = result ? buildAuditSummary(result, mode) : "";

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title={title}>
        <div className="space-y-4">
          <p className="text-sm leading-7 text-slate-600">{description}</p>
          <div>
            <FieldLabel>Page URL</FieldLabel>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <PremiumButton onClick={handleAnalyze} disabled={loading || !url.trim()}>
              {loading ? "Analyzing..." : "Analyze URL"}
            </PremiumButton>
            {summary ? <CopyButton text={summary} /> : null}
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </Card>

      <Card title="Analysis" tone="tint">
        {result ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Score</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{result.score}%</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Word count</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{result.wordCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">CTAs found</p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950">{result.ctas.length}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Core signals</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-7 text-slate-600">
                  <span className="font-semibold text-slate-900">Title:</span>{" "}
                  {result.title || "Missing"} ({result.titleLength})
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-7 text-slate-600">
                  <span className="font-semibold text-slate-900">Meta description:</span>{" "}
                  {result.metaDescriptionLength ? `${result.metaDescriptionLength} chars` : "Missing"}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-7 text-slate-600">
                  <span className="font-semibold text-slate-900">H1 / H2:</span>{" "}
                  {result.headingCount.h1} / {result.headingCount.h2}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-sm leading-7 text-slate-600">
                  <span className="font-semibold text-slate-900">Proof mentions:</span>{" "}
                  {result.proofMentions}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Trust page links detected</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {Object.entries(result.trustTargets).map(([key, value]) => (
                  <span
                    key={key}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-semibold capitalize",
                      value ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-500",
                    ].join(" ")}
                  >
                    {key}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Priority issues</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                {result.issues.length ? (
                  result.issues.map((issue, index) => (
                    <li key={`${issue.message}-${index}`}>
                      <span className="font-semibold capitalize text-slate-900">{issue.severity}:</span>{" "}
                      {issue.message}
                    </li>
                  ))
                ) : (
                  <li>No issues detected by this pass.</li>
                )}
              </ul>
            </div>

            {result.ctas.length ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-semibold text-slate-950">CTA labels detected</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.ctas.map((cta) => (
                    <span key={cta} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      {cta}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-600">
            Enter a URL to score the page and review trust, content depth, CTA visibility, heading structure, and SEO basics.
          </p>
        )}
      </Card>
    </div>
  );
}

function MetaDescriptionGenerator() {
  const [pageType, setPageType] = useState("service");
  const [topic, setTopic] = useState("");
  const [audience, setAudience] = useState("");
  const [benefit, setBenefit] = useState("");
  const [location, setLocation] = useState("");
  const [cta, setCta] = useState("");

  const results = useMemo(() => {
    const cleanTopic = topic.trim() || "website service";
    const cleanAudience = audience.trim() || "businesses";
    const cleanBenefit = benefit.trim() || "stronger visibility and conversions";
    const cleanLocation = location.trim();
    const cleanCta = cta.trim() || "Learn how it works.";
    const locationText = cleanLocation ? ` in ${cleanLocation}` : "";

    const starters =
      pageType === "blog"
        ? [
            `Learn how ${cleanAudience}${locationText} can improve ${cleanTopic} with practical steps for ${cleanBenefit}. ${cleanCta}`,
            `${cleanTopic} guide for ${cleanAudience}${locationText}. Get practical advice for ${cleanBenefit}. ${cleanCta}`,
            `Practical ${cleanTopic} guidance for ${cleanAudience}${locationText} focused on ${cleanBenefit}. ${cleanCta}`,
          ]
        : pageType === "landing"
          ? [
              `${cleanTopic} for ${cleanAudience}${locationText} built to support ${cleanBenefit}. ${cleanCta}`,
              `Get ${cleanTopic}${locationText} designed for ${cleanAudience} who need ${cleanBenefit}. ${cleanCta}`,
              `${cleanTopic}${locationText} that helps ${cleanAudience} achieve ${cleanBenefit}. ${cleanCta}`,
            ]
          : [
              `${cleanTopic} for ${cleanAudience}${locationText} focused on ${cleanBenefit}. ${cleanCta}`,
              `Professional ${cleanTopic}${locationText} for ${cleanAudience} who need ${cleanBenefit}. ${cleanCta}`,
              `${cleanTopic}${locationText} designed to help ${cleanAudience} improve ${cleanBenefit}. ${cleanCta}`,
            ];

    return starters.map((text) => ({
      text,
      length: text.length,
    }));
  }, [audience, benefit, cta, location, pageType, topic]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <Card title="Input details">
        <div className="space-y-4">
          <div>
            <FieldLabel>Page type</FieldLabel>
            <Select value={pageType} onChange={(e) => setPageType(e.target.value)}>
              <option value="service">Service page</option>
              <option value="blog">Blog post</option>
              <option value="landing">Landing page</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Topic or primary keyword</FieldLabel>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Website redesign cost in Nigeria" />
          </div>
          <div>
            <FieldLabel>Audience</FieldLabel>
            <Input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="small business owners" />
          </div>
          <div>
            <FieldLabel>Main benefit</FieldLabel>
            <Input value={benefit} onChange={(e) => setBenefit(e.target.value)} placeholder="clearer budget planning" />
          </div>
          <div>
            <FieldLabel>Location (optional)</FieldLabel>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Lagos" />
          </div>
          <div>
            <FieldLabel>CTA phrase</FieldLabel>
            <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="See pricing and planning tips." />
          </div>
        </div>
      </Card>

      <Card title="Generated descriptions" tone="tint">
        <div className="space-y-4">
          {results.map((item, index) => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-900">Option {index + 1}</p>
                <span className={["rounded-full px-3 py-1 text-xs font-semibold", item.length <= 160 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"].join(" ")}>
                  {item.length} chars
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-600">
            Aim for natural language first. Use the keyword once, foreground the real value, and avoid stuffing multiple offers into one snippet.
          </div>
        </div>
      </Card>
    </div>
  );
}

function WebsiteCostCalculator() {
  const [pages, setPages] = useState(5);
  const [contentReady, setContentReady] = useState("partial");
  const [designLevel, setDesignLevel] = useState("premium");
  const [integrations, setIntegrations] = useState(1);
  const [seoDepth, setSeoDepth] = useState("foundation");
  const [cms, setCms] = useState("nextjs");

  const estimate = useMemo(() => {
    let score = 800;
    score += pages * 120;
    score += integrations * 180;
    if (contentReady === "none") score += 600;
    if (contentReady === "partial") score += 300;
    if (designLevel === "cinematic") score += 900;
    if (designLevel === "premium") score += 500;
    if (seoDepth === "strategy") score += 700;
    if (cms === "ecommerce") score += 1200;
    if (cms === "wordpress") score += 250;

    const low = Math.round(score * 0.9);
    const high = Math.round(score * 1.25);
    return { low, high, score };
  }, [cms, contentReady, designLevel, integrations, pages, seoDepth]);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.88fr_1.12fr]">
      <Card title="Project inputs">
        <div className="space-y-4">
          <div>
            <FieldLabel>Estimated page count</FieldLabel>
            <Input type="number" min={1} max={50} value={pages} onChange={(e) => setPages(Number(e.target.value) || 1)} />
          </div>
          <div>
            <FieldLabel>Content readiness</FieldLabel>
            <Select value={contentReady} onChange={(e) => setContentReady(e.target.value)}>
              <option value="ready">Content is ready</option>
              <option value="partial">Content needs refinement</option>
              <option value="none">Content needs to be created</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Design level</FieldLabel>
            <Select value={designLevel} onChange={(e) => setDesignLevel(e.target.value)}>
              <option value="clean">Clean and simple</option>
              <option value="premium">Premium business site</option>
              <option value="cinematic">Cinematic custom experience</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Integrations</FieldLabel>
            <Input type="number" min={0} max={12} value={integrations} onChange={(e) => setIntegrations(Number(e.target.value) || 0)} />
          </div>
          <div>
            <FieldLabel>SEO scope</FieldLabel>
            <Select value={seoDepth} onChange={(e) => setSeoDepth(e.target.value)}>
              <option value="foundation">Basic foundation</option>
              <option value="strategy">Strategy + structure + launch QA</option>
            </Select>
          </div>
          <div>
            <FieldLabel>Platform type</FieldLabel>
            <Select value={cms} onChange={(e) => setCms(e.target.value)}>
              <option value="nextjs">Custom Next.js site</option>
              <option value="wordpress">WordPress-led build</option>
              <option value="ecommerce">Ecommerce build</option>
            </Select>
          </div>
        </div>
      </Card>

      <Card title="Estimated range" tone="dark">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-blue-200">Indicative range</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
              ${estimate.low.toLocaleString()} - ${estimate.high.toLocaleString()}
            </p>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              This is a planning estimate, not a quote. Final scope changes with content complexity, technical constraints, approval speed, and commercial goals.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              "Higher page counts and ecommerce logic move cost fastest.",
              "Content creation and cinematic custom design increase production time.",
              "SEO strategy adds value when the site needs ranking support from launch.",
              "A formal scope review still matters before anyone commits budget.",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-7 text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

const homepageChecklistGroups = [
  {
    title: "Messaging clarity",
    items: [
      "The hero clearly says what the business does.",
      "The page explains who the offer is for.",
      "The homepage makes the primary offer obvious within one scroll.",
      "Headline and subheadline avoid vague agency language.",
    ],
  },
  {
    title: "Trust and proof",
    items: [
      "There are real trust signals above the fold or shortly after.",
      "The page includes proof, screenshots, testimonials, or case evidence.",
      "About, contact, and trust pages are easy to find.",
    ],
  },
  {
    title: "Conversion flow",
    items: [
      "The main CTA is obvious and repeated at logical points.",
      "The page avoids competing CTA overload.",
      "The user can contact the business without friction.",
    ],
  },
  {
    title: "Search and structure",
    items: [
      "The homepage supports the primary search intent.",
      "Headings follow a logical hierarchy.",
      "The content is substantial enough to deserve ranking.",
    ],
  },
] as const;

function HomepageChecklist() {
  const [mode, setMode] = useState<"interactive" | "url">("url");
  const allItems = homepageChecklistGroups.flatMap((group) => group.items);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const total = allItems.length;
  const completed = allItems.filter((item) => checked[item]).length;
  const score = Math.round((completed / total) * 100);

  if (mode === "url") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            URL analysis
          </button>
          <button
            type="button"
            onClick={() => setMode("interactive")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Manual checklist
          </button>
        </div>
        <UrlAuditTool
          mode="homepage"
          title="Homepage URL review"
          description="Fetch a live homepage and review headline structure, CTA visibility, trust links, proof cues, content depth, and basic SEO signals."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode("url")}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          URL analysis
        </button>
        <button
          type="button"
          onClick={() => setMode("interactive")}
          className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
        >
          Manual checklist
        </button>
      </div>
    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
      <Card title="Checklist">
        <div className="space-y-6">
          {homepageChecklistGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-slate-950">{group.title}</h3>
              <div className="mt-4 space-y-3">
                {group.items.map((item) => (
                  <label key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item])}
                      onChange={(e) => setChecked((prev) => ({ ...prev, [item]: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Assessment" tone="tint">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-blue-700">Homepage score</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{score}%</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {completed} of {total} homepage fundamentals are in place.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
            {score >= 80
              ? "The homepage fundamentals are strong. Focus next on proof depth, SEO polish, and higher-value CTA flow."
              : score >= 55
                ? "The homepage has a workable base, but some of the most important clarity and conversion checks are still missing."
                : "The homepage likely needs a structural rewrite before it can reliably convert or support strong traffic growth."}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {allItems
              .filter((item) => !checked[item])
              .slice(0, 6)
              .map((item) => (
                <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm leading-7 text-slate-600">
                  {item}
                </div>
              ))}
          </div>
        </div>
      </Card>
    </div>
    </div>
  );
}

function AdSenseReadinessChecker() {
  const [mode, setMode] = useState<"interactive" | "url">("url");
  const questions = [
    "The site has About, Contact, Privacy Policy, Terms, and Editorial/Trust pages.",
    "The content is original and written for real people.",
    "The site does not depend on thin pages or doorway pages.",
    "Navigation is clear and public pages are easy to reach.",
    "The layout is content-first and not built around ads.",
    "The site has enough substantial pages to show real value.",
    "The pages avoid exaggerated or misleading claims.",
    "The site looks maintained and trustworthy on mobile.",
  ];
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const yesCount = questions.filter((item) => answers[item]).length;
  const readiness = Math.round((yesCount / questions.length) * 100);

  if (mode === "url") {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
          >
            URL analysis
          </button>
          <button
            type="button"
            onClick={() => setMode("interactive")}
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
          >
            Manual review
          </button>
        </div>
        <UrlAuditTool
          mode="adsense"
          title="AdSense URL review"
          description="Check for visible trust links, content depth, heading structure, placeholder language, and other practical AdSense-readiness signals on a live page."
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setMode("url")}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600"
        >
          URL analysis
        </button>
        <button
          type="button"
          onClick={() => setMode("interactive")}
          className="rounded-full bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700"
        >
          Manual review
        </button>
      </div>
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Readiness review">
        <div className="space-y-3">
          {questions.map((question) => (
            <label key={question} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-700">
              <input
                type="checkbox"
                checked={Boolean(answers[question])}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question]: e.target.checked }))}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span>{question}</span>
            </label>
          ))}
        </div>
      </Card>

      <Card title="Readiness score" tone="dark">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-blue-200">Current score</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">{readiness}%</p>
            <p className="mt-3 text-sm leading-7 text-slate-300">
              This is a practical readiness heuristic, not a Google guarantee.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300">
            {readiness >= 85
              ? "The website looks materially closer to AdSense-safe standards. Final judgment still depends on content depth, trust, and policy compliance."
              : readiness >= 60
                ? "The site may be directionally okay, but still has visible approval risks. Close the missing trust and quality gaps before applying."
                : "The site is not ready yet. Fix content quality, trust surfaces, and navigation before spending time on an application."}
          </div>
        </div>
      </Card>
    </div>
    </div>
  );
}

const launchChecklistGroups = [
  {
    title: "Technical",
    items: ["Forms tested", "Analytics installed", "Robots.txt checked", "Sitemap accessible"],
  },
  {
    title: "SEO",
    items: ["Title tags reviewed", "Meta descriptions reviewed", "Canonicals checked", "Indexation intent confirmed"],
  },
  {
    title: "UX and trust",
    items: ["Mobile layout reviewed", "CTAs tested", "Contact methods visible", "Trust/legal pages linked"],
  },
  {
    title: "Content",
    items: ["Proof sections complete", "Homepage messaging approved", "Service copy approved", "Broken placeholder text removed"],
  },
] as const;

function WebsiteLaunchChecklist() {
  const allItems = launchChecklistGroups.flatMap((group) => group.items);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const completed = allItems.filter((item) => checked[item]).length;
  const percent = Math.round((completed / allItems.length) * 100);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Launch checklist">
        <div className="space-y-6">
          {launchChecklistGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-lg font-semibold text-slate-950">{group.title}</h3>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {group.items.map((item) => (
                  <label key={item} className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-700">
                    <input
                      type="checkbox"
                      checked={Boolean(checked[item])}
                      onChange={(e) => setChecked((prev) => ({ ...prev, [item]: e.target.checked }))}
                      className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600"
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Launch readiness" tone="tint">
        <div className="space-y-5">
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-sm uppercase tracking-[0.16em] text-blue-700">Completion</p>
            <p className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">{percent}%</p>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              {completed} of {allItems.length} launch checks completed.
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 text-sm leading-7 text-slate-600">
            Launches go wrong when teams assume the basics are obvious. This checklist is meant to slow that down and catch avoidable SEO, trust, and tracking errors before go-live.
          </div>
        </div>
      </Card>
    </div>
  );
}

type SitemapApiResult = {
  ok: boolean;
  mode: "urlset" | "sitemapindex" | "unknown";
  urlCount: number;
  issues: string[];
  locSamples: string[];
};

function SitemapValidator() {
  const [sourceType, setSourceType] = useState<"url" | "xml">("url");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SitemapApiResult | null>(null);
  const [error, setError] = useState("");

  async function handleValidate() {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/tools/sitemap-validator/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sourceType === "url" ? { url: value } : { xml: value }),
      });
      const data = (await response.json()) as SitemapApiResult & { error?: string };

      if (!response.ok) {
        setError(data.error || "Validation failed.");
      } else {
        setResult(data);
      }
    } catch {
      setError("Unable to validate sitemap right now.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card title="Validate sitemap">
        <div className="space-y-4">
          <div>
            <FieldLabel>Validation mode</FieldLabel>
            <Select value={sourceType} onChange={(e) => setSourceType(e.target.value as "url" | "xml")}>
              <option value="url">Sitemap URL</option>
              <option value="xml">Paste XML</option>
            </Select>
          </div>
          <div>
            <FieldLabel>{sourceType === "url" ? "Sitemap URL" : "Sitemap XML"}</FieldLabel>
            {sourceType === "url" ? (
              <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://example.com/sitemap.xml" />
            ) : (
              <Textarea rows={12} value={value} onChange={(e) => setValue(e.target.value)} placeholder="<urlset>...</urlset>" />
            )}
          </div>
          <PremiumButton onClick={handleValidate} disabled={loading || !value.trim()}>
            {loading ? "Validating..." : "Validate Sitemap"}
          </PremiumButton>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
      </Card>

      <Card title="Validation results" tone="tint">
        {result ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Mode</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{result.mode}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">URLs</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{result.urlCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Status</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{result.ok ? "Looks valid" : "Needs fixes"}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Issues found</p>
              <ul className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                {result.issues.length ? result.issues.map((issue) => <li key={issue}>• {issue}</li>) : <li>No structural issues detected.</li>}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-950">Sample locations</p>
              <ul className="mt-3 space-y-2 break-all text-sm leading-7 text-slate-600">
                {result.locSamples.map((sample) => (
                  <li key={sample}>{sample}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <p className="text-sm leading-7 text-slate-600">
            Run a validation to inspect sitemap structure, URL counts, duplicates, protocol issues, and missing location tags.
          </p>
        )}
      </Card>
    </div>
  );
}

export default function ToolRenderer({ slug }: { slug: PublicToolSlug }) {
  let tool: React.ReactNode = null;
  if (slug === "meta-description-generator") tool = <MetaDescriptionGenerator />;
  if (slug === "website-cost-calculator") tool = <WebsiteCostCalculator />;
  if (slug === "homepage-checklist") tool = <HomepageChecklist />;
  if (slug === "adsense-readiness-checker") tool = <AdSenseReadinessChecker />;
  if (slug === "website-launch-checklist") tool = <WebsiteLaunchChecklist />;
  if (slug === "sitemap-validator") tool = <SitemapValidator />;
  return <div className="tool-renderer">{tool}</div>;
}
