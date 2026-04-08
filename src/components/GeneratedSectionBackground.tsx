type SectionBackgroundVariant =
  | "answers"
  | "inclusions"
  | "pricing"
  | "proof"
  | "faq"
  | "cta"
  | "snapshot"
  | "links"
  | "trust"
  | "service";

type VariantConfig = {
  primaryCx: number;
  primaryCy: number;
  secondaryCx: number;
  secondaryCy: number;
  lineColor: string;
  pathA: string;
  pathB: string;
  opacity: number;
};

const VARIANTS: Record<SectionBackgroundVariant, VariantConfig> = {
  answers: {
    primaryCx: 18,
    primaryCy: 24,
    secondaryCx: 84,
    secondaryCy: 78,
    lineColor: "#6ee7b7",
    pathA: "M120 260 C330 170 540 350 780 280",
    pathB: "M900 620 C1080 530 1290 700 1470 620",
    opacity: 0.6,
  },
  inclusions: {
    primaryCx: 78,
    primaryCy: 20,
    secondaryCx: 20,
    secondaryCy: 80,
    lineColor: "#34d399",
    pathA: "M150 630 C350 540 560 700 810 620",
    pathB: "M910 240 C1110 140 1290 330 1480 250",
    opacity: 0.58,
  },
  pricing: {
    primaryCx: 82,
    primaryCy: 18,
    secondaryCx: 18,
    secondaryCy: 78,
    lineColor: "#6ee7b7",
    pathA: "M120 290 C330 190 550 360 780 300",
    pathB: "M900 600 C1100 510 1290 690 1470 610",
    opacity: 0.62,
  },
  proof: {
    primaryCx: 20,
    primaryCy: 20,
    secondaryCx: 80,
    secondaryCy: 80,
    lineColor: "#a7f3d0",
    pathA: "M120 320 C360 220 520 390 790 330",
    pathB: "M900 620 C1080 540 1290 720 1480 640",
    opacity: 0.6,
  },
  faq: {
    primaryCx: 18,
    primaryCy: 78,
    secondaryCx: 82,
    secondaryCy: 22,
    lineColor: "#a7f3d0",
    pathA: "M110 620 C320 520 530 690 760 620",
    pathB: "M920 240 C1100 160 1300 320 1470 250",
    opacity: 0.56,
  },
  cta: {
    primaryCx: 78,
    primaryCy: 24,
    secondaryCx: 24,
    secondaryCy: 78,
    lineColor: "#10b981",
    pathA: "M120 300 C330 220 560 380 800 310",
    pathB: "M860 610 C1050 520 1260 680 1460 600",
    opacity: 0.64,
  },
  snapshot: {
    primaryCx: 72,
    primaryCy: 22,
    secondaryCx: 24,
    secondaryCy: 74,
    lineColor: "#6ee7b7",
    pathA: "M120 340 C330 250 560 430 790 350",
    pathB: "M910 620 C1090 530 1280 690 1470 620",
    opacity: 0.58,
  },
  links: {
    primaryCx: 24,
    primaryCy: 22,
    secondaryCx: 78,
    secondaryCy: 74,
    lineColor: "#34d399",
    pathA: "M120 280 C330 170 550 340 790 280",
    pathB: "M900 610 C1090 520 1290 700 1470 610",
    opacity: 0.58,
  },
  trust: {
    primaryCx: 20,
    primaryCy: 26,
    secondaryCx: 82,
    secondaryCy: 72,
    lineColor: "#a7f3d0",
    pathA: "M130 290 C340 200 560 380 790 320",
    pathB: "M900 580 C1090 500 1280 660 1470 590",
    opacity: 0.62,
  },
  service: {
    primaryCx: 78,
    primaryCy: 18,
    secondaryCx: 20,
    secondaryCy: 82,
    lineColor: "#6ee7b7",
    pathA: "M120 300 C340 200 560 390 800 320",
    pathB: "M900 640 C1100 540 1300 710 1470 630",
    opacity: 0.6,
  },
};

function buildSectionSvg(config: VariantConfig) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020805"/>
      <stop offset="58%" stop-color="#04110d"/>
      <stop offset="100%" stop-color="#010403"/>
    </linearGradient>
    <radialGradient id="primary" cx="${config.primaryCx}%" cy="${config.primaryCy}%" r="52%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.26"/>
      <stop offset="80%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="secondary" cx="${config.secondaryCx}%" cy="${config.secondaryCy}%" r="48%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="0.18"/>
      <stop offset="82%" stop-color="#34d399" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#d1fae5" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
    <filter id="blur">
      <feGaussianBlur stdDeviation="18"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#grid)" opacity="0.34"/>
  <rect width="1600" height="900" fill="url(#primary)"/>
  <rect width="1600" height="900" fill="url(#secondary)"/>

  <g opacity="0.42">
    <path d="${config.pathA}" stroke="${config.lineColor}" stroke-opacity="0.22" stroke-width="2" fill="none"/>
    <path d="${config.pathB}" stroke="${config.lineColor}" stroke-opacity="0.18" stroke-width="2" fill="none"/>
    <circle cx="250" cy="260" r="4" fill="#6ee7b7" fill-opacity="0.62"/>
    <circle cx="780" cy="620" r="4" fill="#34d399" fill-opacity="0.55"/>
    <circle cx="1320" cy="300" r="4" fill="#6ee7b7" fill-opacity="0.6"/>
  </g>

  <g filter="url(#blur)" opacity="0.45">
    <ellipse cx="1240" cy="190" rx="170" ry="82" fill="#10b981" fill-opacity="0.24"/>
    <ellipse cx="320" cy="700" rx="180" ry="86" fill="#10b981" fill-opacity="0.14"/>
  </g>
</svg>
`.trim();
}

export default function GeneratedSectionBackground({
  variant,
}: {
  variant: SectionBackgroundVariant;
}) {
  const config = VARIANTS[variant];
  const svg = buildSectionSvg(config);
  const encoded = encodeURIComponent(svg);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encoded}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
        opacity: config.opacity,
      }}
    />
  );
}
