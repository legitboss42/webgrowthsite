import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WorkspacePasswordSignIn from "@/components/auth/WorkspacePasswordSignIn";
import { buildGoogleAuthStartPath, isGoogleAuthConfigured, sanitizeGoogleAuthNext } from "@/lib/googleAuth";
import { isWorkspacePasswordAuthConfigured } from "@/lib/whatsapp/passwordAuth";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

export const metadata: Metadata = {
  title: "Sign in | Web Growth Automation",
  description: "Sign in once to access Web Growth Content Automation, TikTok Publishing and WhatsApp Business.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnifiedSignInPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const requested = typeof params.next === "string" ? params.next : "/dashboard/";
  const nextPath = sanitizeGoogleAuthNext(requested, "/dashboard/");
  const jar = await cookies();
  if (readWebGrowthSessionFromCookieStore(jar)) redirect(nextPath);
  const googleReady = isGoogleAuthConfigured();
  const passwordReady = isWorkspacePasswordAuthConfigured();

  return <main className="min-h-screen bg-[#070a0c] px-5 py-10 text-white sm:py-16">
    <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1013] shadow-2xl lg:grid-cols-[1.05fr_.95fr]">
      <section className="p-7 sm:p-10 lg:p-12">
        <p className="text-xs font-bold uppercase tracking-[.22em] text-emerald-300">Web Growth Automation</p>
        <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl">One account for your automation workspace.</h1>
        <p className="mt-5 max-w-xl text-sm leading-7 text-white/55">Sign in once to move between Content Automation, TikTok Publishing and WhatsApp Business. Provider connections stay separate, but your identity no longer needs three passports.</p>
        <div className="mt-9 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
          {[["Content","Blog-to-social pipeline"],["TikTok","Approval and scheduling"],["WhatsApp","Messaging operations"]].map(([title,detail]) => <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><p className="font-semibold">{title}</p><p className="mt-1 text-xs leading-5 text-white/40">{detail}</p></div>)}
        </div>
        <p className="mt-8 text-xs leading-5 text-white/35">TikTok, Meta and WhatsApp authorization are managed from <Link href="/dashboard/connections/" className="text-emerald-300/80">Connections</Link> after sign-in.</p>
      </section>
      <section className="bg-[#eef3ef] p-7 text-[#13241c] sm:p-10 lg:p-12" aria-labelledby="account-sign-in-title">
        <h2 id="account-sign-in-title" className="text-2xl font-semibold">Sign in to Web Growth</h2>
        <p className="mt-2 text-sm leading-6 text-[#526159]">Use Google or your workspace email and password. Both create the same Web Growth browser session.</p>
        {googleReady ? <Link href={buildGoogleAuthStartPath(nextPath)} className="mt-7 flex h-12 items-center justify-center rounded-xl border border-[#cbd5cd] bg-white px-5 text-sm font-semibold text-[#17352a] shadow-sm transition hover:border-[#9db3a4]">Continue with Google</Link> : <div className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">Google sign-in is not configured in this environment.</div>}
        <div className="my-6 flex items-center gap-3"><span className="h-px flex-1 bg-[#d1d9d3]"/><span className="text-xs font-semibold uppercase tracking-[.14em] text-[#849188]">or</span><span className="h-px flex-1 bg-[#d1d9d3]"/></div>
        <WorkspacePasswordSignIn nextPath={nextPath} available={passwordReady} />
      </section>
    </div>
  </main>;
}
