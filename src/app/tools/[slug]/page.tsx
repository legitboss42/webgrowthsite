import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ToolRenderer from "@/components/tools/ToolRenderer";
import SectionShell from "@/components/home/SectionShell";
import StructuredData from "@/components/StructuredData";
import { getPublicTool, PUBLIC_TOOLS } from "@/lib/tools";
import { buildBreadcrumbSchema, buildPageMetadata } from "@/lib/seo";

export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return PUBLIC_TOOLS.map((tool) => ({ slug: tool.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = getPublicTool(slug);
  if (!tool) {
    return {
      title: "Tool not found",
      robots: { index: false, follow: false },
    };
  }

  return buildPageMetadata({
    title: `${tool.title} | Web Growth Tools`,
    description: tool.description,
    path: `/tools/${tool.slug}/`,
    keywords: tool.keywords,
  });
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getPublicTool(slug);
  if (!tool) return notFound();

  return (
    <>
      <StructuredData
        data={buildBreadcrumbSchema([
          { name: "Home", path: "/" },
          { name: "Tools", path: "/tools" },
          { name: tool.title, path: `/tools/${tool.slug}` },
        ])}
      />

      <main className="bg-[#f7f8fc] text-slate-950">
        <SectionShell tone="canvas" spacing="hero" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full">
            <div className="absolute left-[-10%] top-[-6%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,107,255,0.12),transparent_70%)]" />
            <div className="absolute right-[-8%] top-[4%] h-[25rem] w-[25rem] rounded-full bg-[radial-gradient(circle,rgba(124,92,255,0.12),transparent_70%)]" />
          </div>

          <div className="relative grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
            <div>
              <p className="inline-flex rounded-full border border-blue-100 bg-white/92 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-700 shadow-sm">
                {tool.eyebrow}
              </p>
              <h1 className="mt-5 max-w-[34rem] text-balance text-[3.7rem] font-semibold leading-[0.9] tracking-[-0.07em] text-slate-950 md:text-[4.9rem]">
                {tool.title}
              </h1>
              <p className="mt-4 max-w-[33rem] text-lg leading-8 text-slate-600">{tool.intro}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/tools/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50"
                >
                  Back to Tools
                </Link>
                <Link
                  href="/contact/"
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#3557ff_0%,#4f6bff_45%,#7c5cff_100%)] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:brightness-105"
                >
                  Request a Website Review
                </Link>
              </div>
            </div>

            <div className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Category</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">{tool.category}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-blue-700">Status</p>
                  <p className="mt-2 text-base font-semibold text-slate-950">Live</p>
                </div>
              </div>
              <p className="mt-5 text-sm leading-7 text-slate-600">
                This tool is designed to be practically useful before you hire anyone. Use it for planning, QA, or implementation review.
              </p>
            </div>
          </div>
        </SectionShell>

        <SectionShell tone="white" spacing="compact">
          <ToolRenderer slug={tool.slug} />
        </SectionShell>
      </main>
    </>
  );
}
