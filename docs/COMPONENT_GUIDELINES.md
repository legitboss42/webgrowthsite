# Component Guidelines

## Purpose

This document defines the reusable component system for the Web Growth premium platform rebuild.

The homepage and future Academy/tools surfaces must be built from a small, consistent set of components instead of one-off section markup in route files.

The component system should support:

- homepage platform positioning
- Academy discovery
- free tools discovery
- service conversion
- proof/case-study trust
- newsletter capture

## Core Rules

- Prefer server components by default.
- Introduce client components only when interaction is genuinely needed.
- Build components for reuse across homepage, Academy, tools, and service pages.
- Avoid tightly coupling component logic to one route unless it is a route-specific shell.
- Keep content structures explicit and typed.
- Do not recreate multiple visually-similar card systems.

## Homepage Component Wireframe Plan

The homepage should ultimately be assembled from these sections:

1. Header / Nav
2. Hero
3. Website Growth Cycle
4. Trust Benefit Strip
5. Academy Categories
6. Learning Paths
7. Free Tools
8. Case Studies / Proof
9. Services CTA
10. Newsletter
11. Footer

## Components To Create

### 1. `HomepageHeroPlatform`

Purpose:

- establish Web Growth as a premium website growth platform
- present the “Build. Grow. Monetize.” positioning
- surface two clear entry points

Required content:

- eyebrow
- H1
- supporting paragraph
- primary CTA
- secondary CTA
- optional trust row
- visual cycle block

Mobile behavior:

- text stack first
- CTAs stacked
- cycle visual simplified below content

### 2. `GrowthCycleSection`

Purpose:

- explain the Web Growth operating model

Required items:

- Plan
- Build
- Optimize
- Attract
- Convert
- Monetize

Layout:

- desktop: circular or structured diagram
- mobile: vertical step list or compact radial-to-linear hybrid

Rules:

- must remain readable without animation
- icons and labels must work semantically

### 3. `TrustBenefitStrip`

Purpose:

- fast credibility scan immediately under the hero

Suggested item pattern:

- icon
- short title
- single support line

Example outcomes:

- Practical and actionable
- Beginner to advanced
- Free tools
- Proven strategies
- Built for results

### 4. `AcademyCategoryGrid`

Purpose:

- expose Academy navigation as a product surface

Card content:

- icon
- category title
- one-sentence value statement
- “Explore” text link

Expected categories:

- Website Development
- SEO & Traffic Growth
- Monetization & AdSense
- Performance & Speed
- Content & Copywriting
- Security & Maintenance

Rules:

- keep cards concise
- no article excerpts here
- this is category navigation, not a post feed

### 5. `LearningPathsSection`

Purpose:

- group content into guided progressions

Card content:

- path label
- title
- summary
- module/article counts
- estimated completion time
- CTA

Rules:

- cards should look more substantial than category cards
- emphasize progression and outcomes

### 6. `FreeToolsSection`

Purpose:

- present tools as part of the platform value engine

Card content:

- tool name
- what it helps with
- who it is for
- action link

Rules:

- tools must be clearly real or clearly “coming soon” if ever used
- do not tease unavailable tools on the live homepage unless explicitly planned

### 7. `FeaturedProofSection`

Purpose:

- show real results, real websites, and real strategic outcomes

Possible structure:

- one featured proof band
- supporting metric/outcome bullets
- optional secondary cards

Preferred inputs:

- existing `portfolioCases`
- real screenshots
- real business context

Rules:

- lead with business transformation, not visual gallery language
- keep claims factual

### 8. `PlatformServicesCTA`

Purpose:

- transition from content/tools/platform value into done-for-you services

Content:

- headline
- short service explanation
- one primary CTA
- one secondary CTA

Rules:

- this section is commercial by design
- should feel distinct from Academy/tools sections

### 9. `NewsletterSection`

Purpose:

- build owned audience

Content:

- compact icon or visual cue
- headline
- short value statement
- email field
- button

Rules:

- low friction
- no multi-step form
- no intrusive gating

## Shared Support Components To Standardize

### `SectionHeading`

Use for:

- eyebrow
- H2
- supporting paragraph
- optional section CTA

This should remove repeated section heading markup across homepage sections.

### `SectionShell`

Use for:

- consistent max width
- standard section spacing
- optional background variant

### `PlatformCard`

Base card system for:

- Academy category cards
- tool cards
- simple proof cards

Variants:

- default
- tinted
- compact
- highlighted

### `ActionRow`

Small layout helper for:

- primary + secondary CTAs
- view-all links
- section-level actions

## Existing Components To Reuse

### Reuse with moderate refactor

- `Header`
- `Footer`
- `CTASection`
- `SocialProofSection`
- `CaseStudyCard`
- `LeadMagnetCTA` logic patterns if newsletter capture needs modal/funnel behavior later

### Reuse with light adaptation

- `portfolioCases` data model
- `coreServiceConfigs` for service CTA surfaces
- `posts.ts` category and post metadata models

## Existing Components To Replace On Homepage

These are not wrong, but they are tied to the old homepage strategy and should not drive the new homepage structure:

- `HeroSection`
- `AnswerHighlightsSection`
- `WhatYouGetSection`
- homepage inline service grid
- homepage inline audience section
- homepage inline process section
- homepage inline final CTA block

Reason:

- they are optimized for the current dark, service-led homepage
- they do not reflect Academy/tools/platform-first IA cleanly

## Existing Components To Keep Off The Homepage For Now

- `FAQSection`
- `BlogInlineCTA`
- `EditorialTrustNote`
- blog article support components

These remain valuable elsewhere, but the new homepage should not be overfilled with reading-page patterns.

## Header Rules

Header must support platform IA.

Required nav groups later:

- Academy
- Free Tools
- Services
- Case Studies
- Resources
- About

CTA:

- one strong header CTA only

Rules:

- keep sticky behavior
- simplify active state treatment
- preserve mobile usability
- do not expose noindex/internal routes in core nav

## Footer Rules

Footer should evolve into a platform footer.

Required columns later:

- Academy
- Free Tools
- Resources
- Company
- Legal

Rules:

- preserve trust/legal links
- remove campaign-first emphasis from footer IA
- keep contact paths available

## Hero Rules

- hero must explain platform identity immediately
- one main conversion CTA
- one exploratory CTA
- supporting proof strip allowed
- cycle visual must never overpower copy
- no giant image background required for the new homepage

## Academy Card Rules

- cards are navigational, not article teasers
- titles must be short and outcome-oriented
- support copy must explain what the user gets
- no card should exceed 3 text blocks

## Learning Path Rules

- paths should feel like structured progression
- counts and duration are useful only if real
- keep CTA clear: “Start Path” or “Explore Path”

## Tool Card Rules

- tool usefulness must be explicit
- use practical naming
- avoid vague AI-tool style labels
- card must explain the result of using the tool

## Case Study / Proof Rules

- show real website or real project context
- include business problem and outcome angle
- prefer implementation truth over decorative testimonial styling

## Newsletter Rules

- should feel like product value, not list-building desperation
- copy should promise useful insights
- field and button must fit cleanly on mobile
- avoid dark aggressive banner styling

## Accessibility Rules

- all interactive cards need visible focus treatment
- icons cannot carry meaning alone
- section headings must be semantic
- button vs link distinctions should stay honest
- mobile tap targets must meet comfortable minimum sizes

## Performance Rules

- components should default to server rendering
- avoid large client bundles for homepage interactivity
- avoid carousels unless they are justified
- lazy-load non-critical visuals
- keep visual polish mostly CSS-driven

## Implementation Order For Homepage Components

Phase 3 should build in this order:

1. Header refactor
2. Homepage hero
3. Growth cycle section
4. Trust strip
5. Academy category grid
6. Learning paths section
7. Free tools section
8. Proof section
9. Services CTA
10. Newsletter section
11. Footer refactor

## Files Most Likely To Change In Phase 3

- `src/app/page.tsx`
- `src/components/Header.tsx`
- `src/components/Footer.tsx`
- new `src/components/home/*`
- possibly shared utility components for section shells and cards
