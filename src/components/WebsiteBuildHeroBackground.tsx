function buildHeroBackgroundSvg() {
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#02110d"/>
      <stop offset="52%" stop-color="#041914"/>
      <stop offset="100%" stop-color="#010604"/>
    </linearGradient>
    <radialGradient id="emeraldGlow" cx="78%" cy="22%" r="55%">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.35"/>
      <stop offset="70%" stop-color="#10b981" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="shadowGlow" cx="18%" cy="30%" r="52%">
      <stop offset="0%" stop-color="#b4802f" stop-opacity="0.15"/>
      <stop offset="75%" stop-color="#b4802f" stop-opacity="0.04"/>
      <stop offset="100%" stop-color="#b4802f" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="splitLine" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#10b981" stop-opacity="0.62"/>
      <stop offset="100%" stop-color="#10b981" stop-opacity="0.05"/>
    </linearGradient>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M 48 0 L 0 0 0 48" fill="none" stroke="#d1fae5" stroke-opacity="0.08" stroke-width="1"/>
    </pattern>
    <filter id="softBlur">
      <feGaussianBlur stdDeviation="26"/>
    </filter>
  </defs>

  <rect width="1600" height="900" fill="url(#base)"/>
  <rect width="1600" height="900" fill="url(#grid)" opacity="0.42"/>
  <rect width="1600" height="900" fill="url(#emeraldGlow)"/>
  <rect width="1600" height="900" fill="url(#shadowGlow)"/>

  <g opacity="0.5">
    <rect x="790" y="100" width="2" height="700" fill="url(#splitLine)"/>
    <circle cx="790" cy="120" r="4" fill="#6ee7b7"/>
    <circle cx="790" cy="780" r="4" fill="#6ee7b7"/>
  </g>

  <g filter="url(#softBlur)">
    <ellipse cx="360" cy="280" rx="170" ry="100" fill="#b4802f" fill-opacity="0.22"/>
    <ellipse cx="1220" cy="260" rx="220" ry="125" fill="#10b981" fill-opacity="0.26"/>
    <ellipse cx="980" cy="620" rx="260" ry="130" fill="#10b981" fill-opacity="0.14"/>
  </g>

  <g opacity="0.8">
    <path d="M260 660 L620 460" stroke="#e4c671" stroke-opacity="0.16" stroke-width="2"/>
    <path d="M980 520 L1360 300" stroke="#6ee7b7" stroke-opacity="0.2" stroke-width="2"/>
    <path d="M1030 640 L1420 520" stroke="#6ee7b7" stroke-opacity="0.16" stroke-width="2"/>
  </g>
</svg>
  `.trim();
}

export default function WebsiteBuildHeroBackground() {
  const svg = buildHeroBackgroundSvg();
  const encoded = encodeURIComponent(svg);

  return (
    <div
      data-wb-generated-bg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70"
      style={{
        backgroundImage: `url("data:image/svg+xml,${encoded}")`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
    />
  );
}
