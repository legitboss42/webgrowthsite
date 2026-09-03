# WhatsApp Stage 12 Visual Redesign V2 Plan

Date: 2026-09-03
Branch: `stage12-visual-redesign-v2`
Status: ACTIVE — visual redesign not accepted until all gates below pass.

## Goal
Rebuild the complete WhatsApp platform presentation layer so it follows the 13 approved mockups as the UI specification, while preserving all Stage 1–11 functionality, routes, permissions, Supabase behavior, Meta Cloud API behavior, automations, campaigns, Flows, analytics and AI controls.

The old frontend structure is not authoritative. Existing business logic is reused; visual/component structure is rebuilt.

## Non-negotiable rules
1. No production deployment until the entire redesign passes all gates and is explicitly approved for release.
2. No backend feature changes during this work.
3. No Supabase schema changes unless a real frontend blocker is proven and separately approved.
4. No recurring purple branding. Primary brand accent is Web Growth green.
5. The supplied Web Growth Stage 12 logo must load correctly in all shell placements.
6. Existing buttons/actions must remain functional. No dead decorative controls.
7. Desktop and mobile are designed deliberately, not by shrinking desktop layouts.
8. Build/test success is not design acceptance.
9. No page is marked complete merely because it inherits shared CSS.
10. Every page must receive a component-level layout review against its mockup/reference.

## Design system first
Before page rebuilds, establish reusable app primitives:
- App shell/sidebar/topbar/mobile nav
- Primary, secondary, tertiary, destructive and icon buttons
- Inputs, search, textarea, select, combobox and filters
- Tabs and segmented controls
- KPI/stat cards
- Data tables and mobile list cards
- Status badges/chips
- Empty/loading/error states
- Modal/drawer/popover patterns
- Page headers and action bars
- Two-pane and three-pane workspaces
- Right-side inspector/detail rail
- Builder canvas/node/toolbar/inspector patterns
- Mobile sheet navigation and panel switching
- Shared spacing, radii, borders, typography and hover/focus/disabled states

## Page rebuild order and acceptance target
### 1. Conversations / Inbox
Reference: Mockup 1.
Must be a real three-pane app on desktop: conversation rail, live chat, contact/details inspector. Mobile must use deliberate list/chat/details navigation. Composer must retain working message, attachment, emoji, voice/call-related controls that currently exist.

### 2. Contacts / CRM
Reference: Mockup 2.
Must use CRM secondary rail, dense contact data surface, right-side contact details, stage/tag controls and mobile contact cards/details.

### 3. Automations Hub
Reference: Mockup 3.
Workflows and AI Agents must feel like one operational hub, not cards dropped onto a generic page.

### 4. Automation Builder
Reference: Mockup 4.
Must have true builder composition: node/tool rail, large canvas, canvas toolbar, selected-node inspector, execution/save controls. Existing automation logic stays intact.

### 5. Campaigns
Reference: Mockup 5.
KPI/action header, campaign table/list and campaign details/performance rail.

### 6. Analytics
References: Mockups 6 and 11.
Executive KPI layer, reporting tabs, chart/funnel surfaces, activity or drill-down rail where applicable, responsive chart handling.

### 7. Flows
References: Mockups 7 and 12.
Flow list/management workspace plus builder/canvas composition and inspector. Preserve Meta Flow integration.

### 8. Templates
References: Mockups 8 and 13.
Template KPIs, filtering/search, list/card management, preview/detail rail and existing create/sync/publish actions.

### 9. Team Management
Reference: Mockup 9.
Member KPIs, member management surface, status/role controls, right-side insights/activity when useful.

### 10. Settings
Reference: Mockup 10.
Real settings application with category navigation, focused settings content and account/usage/danger-zone structure. Existing route architecture remains authoritative for behavior.

### 11. Secondary platform screens
Overview, Calls, Saved Replies, Phone Numbers, Account, Platform Administration and any remaining WhatsApp nested page must be redesigned into the same application system. They may derive from the design language above where no dedicated mockup exists.

## Per-page completion checklist
A page is complete only when all are true:
- Layout structure matches the relevant mockup direction.
- Buttons/controls are redesigned, not merely recolored.
- Existing actions still call the correct handlers/routes.
- Empty/loading/error/disabled states fit the new design.
- Desktop layout works at common widths.
- Mobile layout is intentional and usable.
- No accidental horizontal overflow.
- No old light-theme or legacy card fragments remain visually dominant.
- No purple recurring brand accent.
- Logo/assets load where used.

## Functional regression gate
After all pages are rebuilt:
- Run all WhatsApp tests.
- Run TypeScript.
- Run scoped ESLint.
- Run route/internal-link regression checks.
- Run production Next.js build.
- Verify no Stage 1–11 API/permission behavior was intentionally changed.

## Visual acceptance gate
Automated tests are necessary but insufficient.
Before production release:
- Inspect every major route at desktop and mobile widths using an actual rendered preview/browser.
- Compare each dedicated page against its mockup reference.
- Check dialogs, menus, dropdowns, tables, drawers and builder inspectors.
- Repeatedly reload/hard-refresh desktop pages to verify the historical width-expansion defect does not recur.
- Confirm the supplied logo renders correctly.
- Record any deviation and fix it before release.

If browser tooling is unavailable in ChatGPT, production must NOT be declared visually verified. A preview URL plus user screenshots can be used for the visual acceptance loop, but code inspection alone cannot satisfy this gate.

## Release gate
Only after functional regression + visual acceptance:
1. Record completion in docs.
2. Merge the V2 branch to `main` once.
3. Allow one production Vercel deployment.
4. Verify deployment READY.
5. Run production smoke checks on key public/authenticated entry points and review runtime errors.

## Definition of done
The redesign is done when the user can open the platform and recognize the approved mockup system across the entire product, rather than recognizing the old interface beneath a new theme.
