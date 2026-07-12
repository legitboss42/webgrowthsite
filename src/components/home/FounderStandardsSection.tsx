import SectionShell from "./SectionShell";

const standards = [
  {
    title: "No template shortcuts.",
    text: "A redesign should make the business easier to understand, trust, and buy from, not just look different.",
  },
  {
    title: "Proof before polish.",
    text: "Case studies, service clarity, and working contact paths matter more than decorative motion.",
  },
  {
    title: "Cinematic still has to convert.",
    text: "Lighting, imagery, and parallax are used to guide attention, not to hide weak offers or slow the page.",
  },
] as const;

export default function FounderStandardsSection() {
  return (
    <SectionShell tone="canvas" spacing="compact">
      <div className="rounded-[1.65rem] border border-border-hairline bg-white/[0.035] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.22)] md:p-8">
        <div data-reveal className="grid gap-4 md:grid-cols-[0.68fr_1.32fr] md:items-end">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent-gold">
            Operating standards
          </p>
          <h2 className="font-display max-w-3xl text-4xl font-medium leading-[1] tracking-[-0.055em] text-text-primary md:text-5xl">
            The redesign rules we actually build by.
          </h2>
        </div>

        <div data-stagger className="mt-7 grid gap-4 md:grid-cols-3">
          {standards.map((standard) => (
            <article
              key={standard.title}
              className="rounded-[1.25rem] border border-border-hairline bg-bg-ink/62 p-5"
            >
              <h3 className="font-display text-2xl font-medium tracking-[-0.04em] text-text-primary">
                {standard.title}
              </h3>
              <p className="mt-3 text-sm leading-7 text-text-muted">{standard.text}</p>
            </article>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}
