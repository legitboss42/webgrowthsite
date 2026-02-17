# Copilot instructions for Web Growth (webgrowth-info)

Purpose: quickly orient AI coding agents to the repo so they can be productive without human hand-holding.

1. Big picture
- Framework: Next.js (app router) with TypeScript. App entrypoints live under `src/app`.
- UI: React components in `src/components`. Many components use the `*Client` suffix for client-side components (e.g., `PerformanceOptimisationClient`).
- Assets: static images under `public/images`.
- Important config: `next.config.ts` enables `reactCompiler` and project uses Tailwind (`postcss.config.mjs`, `globals.css`).

2. Common workflows / commands
- Dev server: `npm run dev` (runs `next dev`).
- Build: `npm run build` (runs `next build`).
- Start production: `npm run start`.
- Lint: `npm run lint` (ESLint).
- The repo uses `next@14`, `react@19`, and TypeScript — prefer `npm` but other package managers may work.

3. Project-specific conventions & patterns
- App router: pages are folder-based. Example service page: [src/app/services/performance-optimisation/page.tsx](src/app/services/performance-optimisation/page.tsx#L1).
- Exported metadata: pages commonly export `export const metadata: Metadata = { ... }` — use Next's `Metadata` type when editing.
- Client components: filenames often end with `Client` (e.g., `PerformanceOptimisationClient.tsx`) and are imported from `@/components`. Keep PascalCase names and exact spellings.
- Component location: always check `src/components` for shared components. Example directory reference: [src/components](src/components).

4. Common pitfalls discovered in this repo
- Import/name typos: imports use `@/components/PerformanceOptimisationClient` but the component file may be misspelled (e.g., `PerfomanceOptimisationClient.tsx`). If you see "Cannot find module '@/components/...'" verify exact filename in `src/components` and match spelling/casing or rename the file to match imports.
- Client vs server components: files with `Client` suffix are intended to be client components — do not add server-only APIs into them.

5. Integration points & external deps
- Uses `gsap` for animations; look for GSAP usage in `src/components/CodeRain.tsx` or similar files.
- Tailwind + PostCSS are used — global styles in [src/app/globals.css](src/app/globals.css#L1).
- Next image assets are referenced under `public/images/...` and canonical URLs are used in metadata.

6. How to implement small fixes (example)
- Problem: import fails for `@/components/PerformanceOptimisationClient`.
  - Quick fix A: open `src/components` and locate the file name; if the file is `PerfomanceOptimisationClient.tsx` (typo), rename it to `PerformanceOptimisationClient.tsx` or update the import in [src/app/services/performance-optimisation/page.tsx](src/app/services/performance-optimisation/page.tsx#L1).
  - Quick fix B: update the import to the exact file name and ensure exports use the same identifier.

7. Editing & PR guidance for AIs
- Make minimal, focused changes. Preserve project style: TypeScript, PascalCase component names, and no added license headers.
- When creating or renaming component files, update all imports using a repo-wide search.

If any of the above is unclear or you want additional examples (e.g., a checklist for debugging imports, or a short list of files to open first), tell me which areas to expand.