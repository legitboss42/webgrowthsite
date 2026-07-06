# Rebuild Roadmap

## Project Direction

Web Growth is being rebuilt from a service-led agency website into a premium website growth platform.

Platform promise:

- Build.
- Grow.
- Monetize.

Core platform engines:

- services
- Academy content
- free tools
- case studies
- newsletter audience
- future AdSense-safe publishing and monetization

## Phase 1 — Audit Current Site

Completed planning focus:

- inspected current homepage structure
- reviewed route and SEO constraints
- confirmed blog system remains `/blog` for now
- confirmed homepage rebuild should preserve routes, metadata, robots, sitemap, and service URLs

Deliverables from Phase 1:

- homepage audit
- proposed homepage information architecture
- reuse/refactor/rebuild component planning

## Phase 2 — Design System And Wireframe Planning

Current phase objective:

- define the premium platform visual direction
- define homepage wireframe before implementation
- define reusable homepage component system
- document mobile, SEO, accessibility, and performance constraints

Phase 2 deliverables:

- updated `docs/DESIGN_SYSTEM.md`
- updated `docs/COMPONENT_GUIDELINES.md`
- updated `docs/REBUILD_ROADMAP.md`

Key decisions:

- mostly light background
- blue/purple accent system
- dark sections used sparingly for contrast
- Academy-first discovery layer
- platform-first hero
- content-first layout
- subtle motion only

## Phase 3 — Homepage Implementation

Objective:

Implement the new homepage without changing routes or renaming `/blog`.

Homepage section order:

1. Header / nav
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

Implementation rules:

- preserve homepage metadata and canonical behavior
- keep the page mostly server-rendered
- do not expose internal/noindex routes in primary nav
- use new homepage-specific components under a clean `src/components/home/` structure

## Phase 4 — Header, Footer, And Platform Navigation Refinement

Objective:

Refactor global shell to match the platform IA.

Tasks:

- evolve nav labels toward Academy / Tools / Case Studies / Resources
- keep `/blog` route intact while visible label may become Academy later
- restructure footer around platform sections instead of campaign-first links
- preserve legal and trust pages

## Phase 5 — Academy Architecture

Objective:

Turn the existing blog experience into a visible Academy system without breaking blog URLs.

Tasks:

- rename visible “Blog” labeling to “Academy” where safe
- define Academy category landing behavior
- define learning-path relationships
- improve content discovery and hierarchy
- preserve `/blog` route until redirect strategy is approved

## Phase 6 — Article Template Upgrade

Objective:

Create a premium learning/article experience.

Tasks:

- improve article hero/header system
- standardize breadcrumb, metadata, trust, TOC, and related resources
- improve inline CTA strategy
- preserve helpful-content quality and AdSense-safe layout patterns

## Phase 7 — Free Tools Section

Objective:

Establish tools as a major platform surface.

Tasks:

- define tool taxonomy
- create tool landing/index structure
- connect tools to Academy and services
- ensure fast, clean, and trustworthy tool interfaces

## Phase 8 — Case Studies / Proof System

Objective:

Upgrade portfolio-style proof into stronger business case studies.

Tasks:

- strengthen problem → solution → result presentation
- connect proof to relevant services
- connect proof to relevant Academy resources
- keep claims factual and visually credible

## Phase 9 — Service Page Upgrade

Objective:

Bring service pages up to the same premium system level as the homepage.

Tasks:

- unify service templates
- improve fit / not-fit guidance
- improve trust and proof structure
- increase cross-linking with Academy and case studies

## Phase 10 — SEO And Schema Tightening

Objective:

Harden the platform for search performance during and after redesign.

Tasks:

- preserve metadata discipline
- refine homepage title/description for platform positioning
- expand schema only where visible content supports it
- improve internal linking between Academy, tools, services, and case studies
- preserve sitemap and route governance integrity

## Phase 11 — AdSense Readiness Hardening

Objective:

Ensure the platform structure remains monetization-safe.

Tasks:

- preserve About, Contact, Privacy, Terms, Editorial Policy
- add Disclaimer if required later
- avoid thin category/index pages
- ensure Academy pages remain content-first
- plan safe ad placements only on substantial informational content

## Phase 12 — QA And Launch Readiness

Objective:

Validate the redesign before rollout.

Checks:

- build
- lint
- typecheck
- route verification
- metadata verification
- sitemap validation
- mobile QA
- accessibility QA
- performance QA
- visual consistency QA

## Homepage Wireframe Summary

### Header / nav

- lightweight, premium, mostly white shell
- academy/tools/services/proof-led IA

### Hero

- strongest statement of platform identity
- “Build. Grow. Monetize.”
- two main actions
- cycle visual integrated

### Website Growth Cycle

- explains full platform model

### Trust Benefit Strip

- immediate scanable value cues

### Academy Categories

- category navigation into structured learning

### Learning Paths

- guided progression for different goals

### Free Tools

- practical utility surface

### Case Studies / Proof

- real websites and strategic outcomes

### Services CTA

- done-for-you implementation entry point

### Newsletter

- audience capture with a calm, product-like signup experience

### Footer

- platform footer with trust/legal integrity

## Constraints That Must Hold Across All Phases

- do not break routes
- do not rename `/blog` until redirect strategy is approved
- do not remove trust/legal pages
- do not break metadata, sitemap, robots, or canonical logic
- do not expose internal routes in public IA
- do not regress performance for visual polish

## Recommended Immediate Next Task

Start Phase 3 by implementing the homepage only:

- create homepage-specific components
- refactor header/footer where needed for homepage support
- preserve route and SEO behavior
- do not begin Academy route renaming yet
