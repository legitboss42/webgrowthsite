import Link from "next/link";
export default function SchedulerLanding() {
  return <main className="relative isolate overflow-hidden px-5 py-20">
    <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(98,245,230,.14),transparent_28%),radial-gradient(circle_at_85%_30%,rgba(255,82,105,.12),transparent_30%)]" />
    <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[1.25fr_.75fr]">
      <section><p className="text-xs font-bold uppercase tracking-[.28em] text-[#62f5e6]">Free public beta</p>
        <h1 className="mt-6 max-w-4xl font-serif text-5xl leading-[.95] sm:text-7xl">Your TikTok post, approved once. Published on schedule.</h1>
        <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">Upload original videos or photo stories, review every setting TikTok requires, then schedule an automatic Direct Post in a five-minute submission window.</p>
        <div className="mt-9 flex flex-wrap gap-3"><Link href="/api/scheduler/auth/authorize/?mode=login&returnTo=/scheduler/dashboard/" className="rounded-full bg-[#62f5e6] px-6 py-3 font-bold text-[#071111]">Continue with TikTok</Link><a href="#how" className="rounded-full border border-white/20 px-6 py-3">How it works</a></div>
      </section>
      <aside className="rounded-[2rem] border border-white/10 bg-white/[.04] p-6 shadow-2xl">
        <p className="text-sm text-white/50">Publishing rail</p>
        {["Preview locked","Creator approved","Scheduled 14:30 WAT","TikTok processing"].map((item,index)=><div key={item} className="mt-5 flex items-center gap-4"><span className={`grid size-9 place-items-center rounded-full border ${index<2?"border-[#62f5e6] text-[#62f5e6]":"border-white/20 text-white/50"}`}>{index+1}</span><span>{item}</span></div>)}
      </aside>
    </div>
    <section id="how" className="mx-auto mt-24 grid max-w-7xl gap-5 md:grid-cols-3">{["Connect securely","Approve the exact post","Publish automatically"].map((title,index)=><article key={title} className="rounded-3xl border border-white/10 bg-black/20 p-7"><span className="text-[#ff5269]">0{index+1}</span><h2 className="mt-8 font-serif text-2xl">{title}</h2></article>)}</section>
  </main>;
}
