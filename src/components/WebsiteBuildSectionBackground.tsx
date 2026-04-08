type WebsiteBuildSectionBackgroundProps = {
  variant:
    | "problem"
    | "comparison"
    | "services"
    | "audience"
    | "process"
    | "faq"
    | "final";
};

type VariantConfig = {
  primaryCx: number;
  primaryCy: number;
  secondaryCx: number;
  secondaryCy: number;
  primaryOpacity: number;
  secondaryOpacity: number;
  lineColor: string;
  dotColor: string;
  pathA: string;
  pathB: string;
};

const SECTION_CONFIG: Record<WebsiteBuildSectionBackgroundProps["variant"], VariantConfig> = {
  problem: {
    primaryCx: 18,
    primaryCy: 22,
    secondaryCx: 84,
    secondaryCy: 78,
    primaryOpacity: 0.24,
    secondaryOpacity: 0.16,
    lineColor: "#fca5a5",
    dotColor: "#f87171",
    pathA: "M150 220 C360 120 560 320 780 250",
    pathB: "M940 520 C1120 450 1320 620 1470 520",
  },
  comparison: {
    primaryCx: 22,
    primaryCy: 70,
    secondaryCx: 80,
    secondaryCy: 30,
    primaryOpacity: 0.2,
    secondaryOpacity: 0.2,
    lineColor: "#6ee7b7",
    dotColor: "#34d399",
    pathA: "M140 600 C300 520 480 670 700 590",
    pathB: "M860 250 C1040 170 1260 360 1470 280",
  },
  services: {
    primaryCx: 72,
    primaryCy: 20,
    secondaryCx: 20,
    secondaryCy: 82,
    primaryOpacity: 0.24,
    secondaryOpacity: 0.12,
    lineColor: "#6ee7b7",
    dotColor: "#10b981",
    pathA: "M170 350 C360 290 540 440 780 360",
    pathB: "M920 650 C1110 560 1280 700 1460 630",
  },
  audience: {
    primaryCx: 26,
    primaryCy: 30,
    secondaryCx: 78,
    secondaryCy: 74,
    primaryOpacity: 0.18,
    secondaryOpacity: 0.22,
    lineColor: "#a7f3d0",
    dotColor: "#34d399",
    pathA: "M120 250 C340 180 530 330 780 280",
    pathB: "M860 560 C1030 490 1270 640 1460 550",
  },
  process: {
    primaryCx: 80,
    primaryCy: 24,
    secondaryCx: 24,
    secondaryCy: 76,
    primaryOpacity: 0.22,
    secondaryOpacity: 0.16,
    lineColor: "#6ee7b7",
    dotColor: "#10b981",
    pathA: "M140 610 C330 510 520 650 760 590",
    pathB: "M900 230 C1060 170 1270 320 1460 250",
  },
  faq: {
    primaryCx: 18,
    primaryCy: 76,
    secondaryCx: 82,
    secondaryCy: 24,
    primaryOpacity: 0.16,
    secondaryOpacity: 0.16,
    lineColor: "#a7f3d0",
    dotColor: "#6ee7b7",
    pathA: "M110 640 C320 540 530 690 760 620",
    pathB: "M920 230 C1100 140 1300 300 1470 230",
  },
  final: {
    primaryCx: 78,
    primaryCy: 24,
    secondaryCx: 24,
    secondaryCy: 78,
    primaryOpacity: 0.3,
    secondaryOpacity: 0.2,
    lineColor: "#34d399",
    dotColor: "#6ee7b7",
    pathA: "M120 300 C330 220 560 380 800 310",
    pathB: "M860 610 C1050 520 1260 680 1460 600",
  },
};

function buildSectionSvg(config: VariantConfig) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020805"/>
      <stop offset="56%" stop-color="#04110d"/>
      <stop offset="100%" stop-color="#010403"/>
    </linearGradient>
    <radialGradient id="primary" cx="${config.primaryCx}%" cy="${config.primaryCy}%" r="50%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="${config.primaryOpacity}"/>
      <stop offset="80%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="secondary" cx="${config.secondaryCx}%" cy="${config.secondaryCy}%" r="48%">
      <stop offset="0%" stop-color="#34d399" stop-opacity="${config.secondaryOpacity}"/>
      <stop offset="82%" stop-color="#34d399" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid" width="54" height="54" patternUnits="userSpaceOnUse">
      <path d="M 54 0 L 0 0 0 54" fill="none" stroke="#d1fae5" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
    <filter id="blur">
      <feGaussianBlur stdDeviation="20"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#bg)"/>
  <rect width="1600" height="900" fill="url(#grid)" opacity="0.34"/>
  <rect width="1600" height="900" fill="url(#primary)"/>
  <rect width="1600" height="900" fill="url(#secondary)"/>

  <g opacity="0.42">
    <path d="${config.pathA}" stroke="${config.lineColor}" stroke-opacity="0.22" stroke-width="2" fill="none"/>
    <path d="${config.pathB}" stroke="${config.lineColor}" stroke-opacity="0.18" stroke-width="2" fill="none"/>
    <circle cx="230" cy="240" r="4" fill="${config.dotColor}" fill-opacity="0.65"/>
    <circle cx="760" cy="610" r="4" fill="${config.dotColor}" fill-opacity="0.55"/>
    <circle cx="1320" cy="290" r="4" fill="${config.dotColor}" fill-opacity="0.6"/>
  </g>

  <g filter="url(#blur)" opacity="0.5">
    <ellipse cx="1260" cy="180" rx="180" ry="86" fill="#10b981" fill-opacity="0.22"/>
    <ellipse cx="290" cy="710" rx="190" ry="90" fill="#10b981" fill-opacity="0.16"/>
  </g>
</svg>
`.trim();
}

export default function WebsiteBuildSectionBackground({
  variant,
}: WebsiteBuildSectionBackgroundProps) {
  const svg = buildSectionSvg(SECTION_CONFIG[variant]);
  const encoded = encodeURIComponent(svg);

  return (
    <div
      data-wb-section-bg
      data-wb-section-bg-variant={variant}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-65"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encoded}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}
