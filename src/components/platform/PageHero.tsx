import CinematicHero from "@/components/platform/CinematicHero";

type PageHeroProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  aside?: React.ReactNode;
  chips?: string[];
  theme?: "light" | "dark";
};

export default function PageHero({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  aside,
  chips,
  theme: _theme = "light",
}: PageHeroProps) {
  return (
    <CinematicHero
      eyebrow={eyebrow}
      title={title}
      description={description}
      pageType="platform_page"
      variant="editorial"
      primaryAction={primaryCta ? { label: primaryCta.label, href: primaryCta.href, ctaName: primaryCta.label.toLowerCase().replace(/\s+/g, "_"), destination: primaryCta.href } : undefined}
      secondaryAction={secondaryCta ? { label: secondaryCta.label, href: secondaryCta.href, ctaName: secondaryCta.label.toLowerCase().replace(/\s+/g, "_"), destination: secondaryCta.href } : undefined}
      aside={aside ?? (chips?.length ? (
        <div className="border-l border-border-hairline pl-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-accent-teal">At a glance</p>
          <div className="mt-5 space-y-3">
            {chips.map((chip, index) => <p key={chip} className="border-b border-border-hairline pb-3 text-sm text-text-muted"><span className="mr-3 font-display text-accent-gold">0{index + 1}</span>{chip}</p>)}
          </div>
        </div>
      ) : undefined)}
    />
  );
}
