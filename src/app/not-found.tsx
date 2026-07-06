import Link from "next/link";
import { buildPageMetadata } from "@/lib/seo";

export const metadata = buildPageMetadata({
  title: "Page Not Found | Web Growth",
  description:
    "The page you were looking for is not available. Return to Web Growth to explore services, Academy resources, and website growth guidance.",
  path: "/not-found",
  noIndex: true,
});

export default function NotFound() {
  return (
    <main className="bg-[#f7f8fc] text-slate-950">
      <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col items-start justify-center px-5 py-20 sm:px-6">
        <p className="inline-flex rounded-full border border-blue-100 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-700 shadow-sm">
          404
        </p>
        <h1 className="mt-6 text-balance text-4xl font-semibold tracking-[-0.05em] text-slate-950 md:text-6xl">
          This page is not part of the public Web Growth platform.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          The route may have moved, been retired, or never been intended as a
          public destination. Use the main platform paths below instead.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-700 px-6 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,107,255,0.28)] transition hover:bg-blue-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Return Home
          </Link>
          <Link
            href="/blog/"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-blue-200 bg-white px-6 text-sm font-semibold text-blue-800 transition hover:border-blue-300 hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-700"
          >
            Explore the Academy
          </Link>
        </div>
      </section>
    </main>
  );
}
