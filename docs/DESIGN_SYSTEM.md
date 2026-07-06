# Design System

## Purpose

This document defines the visual and interaction system for the Web Growth premium platform rebuild.

The goal is to move Web Growth from a dark, service-led agency homepage into a lighter, premium website growth platform that feels like a blend of:

- high-end SaaS
- structured learning platform
- modern documentation system
- premium strategy consultancy

Core positioning:

- Build.
- Grow.
- Monetize.

This system must support:

- service conversion
- Academy content discovery
- free tools discovery
- case study trust building
- future AdSense-safe publishing

It must remain:

- content-first
- fast
- accessible
- mobile-first
- SEO-safe

## Current Repo Reality

The current codebase already provides:

- Next.js App Router
- Tailwind v4 via `@import "tailwindcss"` in `src/app/globals.css`
- centralized metadata helpers in `src/lib/seo.ts`
- a dark/emerald visual language
- reusable premium-style card sections
- fixed site header and footer shells

The rebuild should preserve:

- route continuity
- metadata discipline
- Core Web Vitals protection
- lightweight animation

The rebuild should change:

- overall homepage visual tone from dark-heavy to mostly light
- homepage positioning from agency-first to platform-first
- visible “Blog” framing toward “Academy” framing, without renaming `/blog` yet

## Final Visual Direction

Web Growth should feel:

- premium
- structured
- calm
- intelligent
- modern
- commercially serious

It should not feel:

- noisy
- startup-gimmicky
- over-animated
- template-heavy
- crypto-like
- dark everywhere

Reference direction for implementation:

- mostly off-white canvas
- soft blue and purple accent system
- clean white cards
- subtle gradients
- dark sections used only as contrast bands
- generous spacing
- restrained but polished motion

## Brand Personality Through UI

The interface should communicate:

- credibility before hype
- systems before decoration
- learning before selling
- outcomes before features

Visual hierarchy should tell users:

1. what Web Growth is
2. what they can do here
3. where to start
4. how to trust it
5. what next action to take

## Color Palette

### Core neutrals

- `bg.canvas`: `#F7F8FC`
- `bg.surface`: `#FFFFFF`
- `bg.surface-soft`: `#F1F4FA`
- `bg.section-alt`: `#EEF2FF`
- `border.soft`: `#E5EAF4`
- `border.strong`: `#D6DDED`
- `text.primary`: `#111827`
- `text.secondary`: `#4B5563`
- `text.tertiary`: `#6B7280`

### Primary accents

- `accent.blue`: `#4F6BFF`
- `accent.blue-strong`: `#3557FF`
- `accent.purple`: `#7C5CFF`
- `accent.purple-soft`: `#EDE8FF`
- `accent.sky-soft`: `#EAF2FF`

### Support accents

- `accent.green-soft`: `#E9F9F1`
- `accent.green`: `#22C55E`
- `accent.gold-soft`: `#FFF4D6`
- `accent.gold`: `#F5B942`

### Contrast darks

- `bg.dark`: `#0F172A`
- `bg.dark-elevated`: `#162033`
- `text.on-dark`: `#F8FAFC`
- `text.on-dark-muted`: `rgba(248,250,252,0.72)`

### Palette rules

- Off-white is the primary page background.
- White is the primary card color.
- Blue is the main action color.
- Purple is the support accent for platform/learning/tool surfaces.
- Green is reserved for success, validation, or performance outcomes.
- Gold is rare and should only appear as a premium micro-accent, not a main CTA color.
- Dark sections are for contrast bands only, not the default page state.

## Background System

### Page-level background

Default page background:

- off-white
- subtle radial wash
- extremely light grid or noise only if performance-safe

### Section backgrounds

Use only three background families:

1. `Light default`
   - off-white or white
   - for most informational sections

2. `Tinted platform band`
   - pale blue / pale purple wash
   - for Academy, tools, and learning-path sections

3. `Dark contrast band`
   - navy/slate
   - for one or two strategic sections only:
     - growth cycle
     - strong CTA band
     - optionally footer

### Background rules

- Do not place every section inside a card.
- Do not use floating-glass effects everywhere.
- Do not use loud radial blobs or oversaturated gradient fog.
- Do not make the page feel like a pitch deck.

## Typography Rules

### Font approach

Use the repo’s existing sans-first approach unless a future type upgrade is intentional and performance-safe.

Typography should feel:

- clean
- editorial
- product-grade
- high legibility

### Headings

- strong, dense, confident
- no negative letter spacing beyond subtle heading tuning
- line lengths kept controlled

Suggested scale guidance:

- Hero H1: `text-5xl` to `text-7xl` desktop, `text-4xl` mobile
- Section H2: `text-3xl` to `text-5xl`
- Section H3: `text-xl` to `text-2xl`
- Card titles: `text-lg` to `text-xl`

### Body text

- default body: `text-base` to `text-lg`
- long-form supporting copy: `leading-7` or `leading-8`
- card body: `text-sm` or `text-base`

### Eyebrows / labels

- short
- uppercase or title-case depending on context
- high contrast but restrained
- not overused

### Typography rules

- Avoid giant paragraphs in heroes.
- Keep supporting text concise and scannable.
- Use shorter, cleaner wording on the homepage than on article pages.
- Use larger text only when it improves clarity.

## Spacing Scale

Use a stable spacing system across components:

- `4`
- `8`
- `12`
- `16`
- `20`
- `24`
- `32`
- `40`
- `48`
- `64`
- `80`
- `96`
- `120`

### Section spacing

- mobile section padding: `py-14` to `py-16`
- desktop section padding: `py-20` to `py-28`

### Container rules

- standard content max width: `max-w-6xl`
- reading-heavy narrow blocks: `max-w-3xl` or `max-w-4xl`
- do not stretch text across very wide screens

## Button Styles

### Primary button

Use for main page action only.

Style:

- solid blue fill
- white text
- subtle shadow
- rounded-xl
- high contrast

Behavior:

- mild upward lift on hover
- no aggressive glow
- clear focus ring

### Secondary button

Use for alternate action.

Style:

- white or transparent background
- blue border
- blue text
- light fill on hover

### Tertiary / text action

Use for:

- “Explore”
- “View all”
- “Read more”

Style:

- text + arrow
- no fake button chrome

### Button rules

- minimum tap height: `44px`
- never place two equally dominant primary buttons beside each other
- on mobile, stacked CTAs should go full width where appropriate

## Card Styles

### Standard content card

Use for:

- Academy categories
- learning paths
- tools
- case study previews

Style:

- white background
- soft border
- radius: `16px` to `20px`
- light shadow only
- no heavy glassmorphism

### Feature strip card

Use for:

- trust benefit strip
- concise icon + copy tiles

Style:

- low-height
- icon-led
- compact copy
- softer border than major cards

### Highlight card

Use sparingly for:

- hero support panel
- featured path
- featured tool

Style:

- subtle tinted background
- more visual emphasis than standard cards
- never visually louder than hero headline

### Card rules

- no card-inside-card nesting for ordinary layout
- keep repeated cards structurally consistent
- align titles, spacing, and CTAs across sibling cards

## Section Styles

Homepage section types should be:

1. Hero
2. Visual process / cycle
3. Trust strip
4. Category grid
5. Learning-path band
6. Tools grid
7. Proof band
8. Services CTA
9. Newsletter strip
10. Footer

Each section needs:

- one clear purpose
- a section label only if it helps
- one dominant CTA or next action

## Icon Style

Use clean line icons.

Rules:

- consistent stroke weight
- slightly rounded geometry
- no random mixed icon sets
- no 3D icons
- no playful cartoon icons

Preferred usage:

- category cards
- trust strip
- cycle steps
- tool cards
- footer utilities

## Gradient Rules

Allowed:

- soft blue-to-purple accents
- pale surface washes
- very subtle CTA emphasis gradients

Not allowed:

- multicolor rainbow gradients
- giant blurry blobs dominating the viewport
- dark neon glow effects
- harsh saturated backgrounds behind long text

## Motion Rules

Motion must be subtle, optional, and purposeful.

### Allowed motion

- fade/slide reveal
- hover elevation
- underline or arrow motion
- soft section-entry transitions
- drawer/menu transitions

### Avoid

- parallax-heavy homepage
- looping motion backgrounds
- flashy dashboard-like counters unless meaningful
- scroll-jacking
- animation that delays reading

### Technical rules

- CSS first
- Framer Motion only when the interaction truly needs orchestration
- avoid GSAP on the homepage unless a specific interaction cannot be done cleanly otherwise
- always honor `prefers-reduced-motion`

## Mobile Rules

Homepage must be designed mobile-first.

### Global mobile behavior

- single-column first
- compact but breathable spacing
- no tiny utility text
- no horizontally cramped card grids

### Mobile-specific rules

- hero CTAs stack
- cycle becomes vertical or simplified radial-to-linear layout
- trust strip becomes 2-column or horizontal snap if necessary
- Academy categories become 2-column max on small tablets, 1-column where needed
- learning paths stack vertically
- tool cards remain scannable in 1 or 2 columns
- proof section image/content must not cause overflow
- newsletter form must stack cleanly

### Mobile safety

- no clipped shadows that hide content
- no layout shifts from lazy-loaded visuals without dimensions
- no long labels that break buttons awkwardly

## Accessibility Rules

- maintain AA contrast minimum
- blue/purple accents must still pass contrast on off-white
- keyboard focus must be visible everywhere
- headings must follow real hierarchy
- section labels must not replace true headings
- icons need text labels or accessible names
- decorative gradients must not reduce readability
- all cards with actions need obvious interactive affordance

## Performance Rules

- homepage should remain primarily server-rendered
- limit client-only sections
- use optimized static imagery
- avoid heavy illustration or animation libraries
- do not load large carousels above the fold
- avoid oversized visual assets in Academy/tools/proof sections
- keep decorative layers CSS-based where possible
- avoid introducing JavaScript just to animate basic hover states

## Homepage Wireframe Principles

The homepage must feel like a platform entry point, not a stacked sales page.

It should answer:

1. What is Web Growth?
2. What can I do here?
3. Where do I start?
4. Why should I trust this?
5. What action should I take next?

## Homepage Visual Hierarchy

### 1. Hero

- light canvas
- strongest message
- cycle visual lives in or beside hero
- two clear CTAs

### 2. Trust benefit strip

- concise
- icon-led
- low-height
- immediately scannable

### 3. Academy categories

- structured learning grid
- cards feel like platform navigation, not blog teasers

### 4. Learning paths

- slightly larger cards than category grid
- emphasize progression and outcomes

### 5. Tools

- compact utility cards
- clearly explain usefulness

### 6. Proof

- one strong featured proof band
- support cards or bullets can sit beside it

### 7. Services CTA

- clearly commercial
- separated from Academy/tools so the service offer feels intentional

### 8. Newsletter

- simple, clean, low-friction

## Existing Components: Reuse vs Replace

### Reuse with refactor

- `Header`
- `Footer`
- `SocialProofSection`
- `CTASection`

### Replace for homepage-specific use

- current `HeroSection`
- current homepage inline service/process blocks
- current dark-heavy section stack

### Keep out of homepage unless reworked

- current FAQ-first homepage emphasis
- current “web design agency in Nigeria” hero framing
- heavy dark image-backed panels as dominant style

## Implementation Constraints For Future Tasks

- do not rename `/blog` in Phase 3
- do not change route governance during homepage redesign
- preserve metadata and canonical behavior
- preserve existing service URLs
- preserve footer legal/trust links
- keep the homepage performant while shifting to a lighter visual system
