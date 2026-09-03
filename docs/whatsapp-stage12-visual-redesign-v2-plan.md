# WhatsApp Stage 12 Visual Redesign V2 Execution Plan

Date: 2026-09-03
Branch: `stage12-visual-redesign-v2`
Status: ACTIVE — current production design is not accepted.

## Objective
Rebuild the WhatsApp product presentation layer so the 13 approved mockups are treated as the design specification. Preserve all Stage 1–11 product behavior, APIs, permissions, tenancy, Supabase data, Meta Cloud API integrations, automation logic, campaign logic, Flow logic, analytics and AI controls.

This is not a theme pass. Existing backend/business logic may be reused. Existing visual structure is not authoritative.

---

# 1. Success Criteria

The redesign will only be considered successful when all of the following are true:

1. Every WhatsApp product route is visually part of one coherent app system.
2. Dedicated mockup pages visibly follow their matching mockup composition, not merely its colors.
3. Desktop and mobile both have deliberate layouts.
4. Existing features remain functional and permissions remain unchanged.
5. No dead buttons, placeholder controls or broken navigation exist.
6. The supplied Web Growth logo renders correctly.
7. Green is the primary product accent; purple is not used as recurring branding.
8. Old light-theme/website-style components are no longer visually dominant.
9. All automated regression gates pass.
10. A real rendered visual review is completed before merge to main.
11. The user has not rejected the visual result.

---

# 2. Hard Rules During Implementation

- Work only on `stage12-visual-redesign-v2` until visual acceptance.
- Do not merge to `main` early.
- Do not intentionally deploy production early.
- Do not change Supabase schema for a visual problem.
- Do not change WhatsApp feature behavior unless a regression is discovered and a fix is required to preserve existing behavior.
- Do not redesign by wrapping old pages in new cards and calling them complete.
- Do not mark a route complete because shared CSS happens to style it.
- Do not use automated tests as proof of visual quality.
- Do not skip mobile.
- Do not substitute a different logo asset.

---

# 3. Phase A — Inventory Before Rebuild

Before replacing page layouts, create a route/component inventory covering every WhatsApp-facing screen.

For each route record:
- route path
- page/component entry file
- major child components
- current data loaders
- current server actions / API calls
- role/permission constraints
- navigation targets
- modals/drawers/popovers used
- mobile behavior
- dedicated mockup reference, if any

The inventory must cover at minimum:
- Overview
- Conversations / Inbox
- Contacts / CRM
- Automations Hub
- Automation Builder
- AI Agents
- Campaigns
- Analytics main / advanced / messages / calls / conversations
- Flows library / builder
- Templates library / create / preview/details
- Team Management
- Workspace Settings and nested settings routes
- Saved Replies
- Calls
- Phone Numbers
- Account
- Platform Administration
- any nested WhatsApp route discovered during inventory

**Phase A gate:** no page may be silently omitted from the redesign.

---

# 4. Phase B — Build the App Design System

Build reusable components before rebuilding pages so every screen uses the same product language.

## B1. App shell
Create/rebuild:
- desktop primary sidebar
- mobile drawer
- mobile bottom navigation
- top bar
- workspace switch/state display
- member/profile area
- active route treatment
- responsive content frame
- viewport width containment

## B2. Core controls
Create consistent reusable variants for:
- primary action button
- secondary action button
- tertiary/ghost button
- danger/destructive button
- icon-only button
- split/dropdown action
- text input
- search input
- textarea
- select/combobox
- checkbox/radio/switch
- filter chips
- tabs
- segmented controls
- pagination
- status badge
- avatar

Each must include:
- default
- hover
- focus
- active
- disabled
- loading where applicable

## B3. Data surfaces
Create:
- KPI/stat cards
- dense tables
- mobile data cards
- empty state
- skeleton/loading state
- inline error state
- page error state
- confirmation dialog
- modal
- drawer/sheet
- popover/menu
- toast/feedback surface

## B4. Workspace composition primitives
Create reusable layouts for:
- two-pane workspace
- three-pane workspace
- left secondary rail
- right inspector rail
- sticky detail panel
- full-height canvas
- builder tool rail
- builder node card
- builder canvas toolbar
- builder inspector

## B5. Visual tokens
Lock:
- background hierarchy
- border hierarchy
- green accent hierarchy
- semantic success/warning/error/info colors
- typography scale
- spacing scale
- radii
- shadows
- desktop and mobile breakpoints

**Phase B gate:** no page-level implementation starts until shell + controls + workspace primitives exist and can replace legacy page chrome.

---

# 5. Phase C — Rebuild the 13 Mockup-Driven Screens

Each screen is rebuilt structurally. Existing data/actions are reconnected afterward.

## C1. Conversations / Inbox — Mockup 1
Desktop target:
- left conversation list rail
- center live chat panel
- right contact/details inspector
- persistent composer
- compact app header

Rebuild:
- conversation search/filter controls
- conversation row states
- unread/assignment/status indicators
- message bubbles and system events
- attachment/media presentation
- composer controls
- contact inspector
- assignment/tag/stage controls
- empty conversation state

Mobile target:
- list view
- chat view
- details view
- explicit navigation between the three
- bottom-safe composer

Preserve:
- real-time messaging
- attachments
- emoji
- voice/call-related existing actions
- assignment
- notes
- tags
- CRM state
- typing/presence behavior already implemented

**Acceptance:** it must visually read like Mockup 1 before moving on.

## C2. Contacts / CRM — Mockup 2
Desktop target:
- CRM secondary navigation rail
- dense contact table/list
- right contact detail panel

Rebuild:
- stage filters
- tag filters
- search
- import/create actions
- contact rows
- selected contact details
- stage/tag controls
- conversation link
- custom/contact fields

Mobile:
- contact cards/list
- selected contact detail screen

**Acceptance:** selected contact context must remain visible without turning the page into a generic stacked card dashboard.

## C3. Automations Hub — Mockup 3
Rebuild:
- workflow/AI Agent tab system
- workflow summary KPIs
- workflow cards/list
- status controls
- create action
- live run/job summary
- AI Agent section

**Acceptance:** operational hub layout, not legacy manager dropped inside a shell.

## C4. Automation Builder — Mockup 4
Rebuild actual builder composition:
- left node/action palette
- central canvas
- canvas toolbar
- zoom controls
- selected node state
- right node inspector
- save/publish/pause controls
- execution state/history access

Preserve:
- node types
- edges/connectors
- versioning
- lifecycle
- all existing trigger/action logic

Mobile/tablet:
- canvas remains usable
- palette and inspector become sheets/drawers

**Acceptance:** builder must visually resemble a purpose-built automation editor.

## C5. Campaigns — Mockup 5
Rebuild:
- KPI strip
- campaign action bar
- campaign table/list
- audience/segment context
- right detail/performance inspector
- empty/new campaign state

Preserve campaign backend and sending safeguards.

## C6. Analytics — Mockups 6 and 11
Rebuild:
- executive KPIs
- report tabs
- chart cards
- funnel visualization area
- team/channel breakdowns
- activity/top-contact rail where applicable
- 7/30/90 day selector
- drill-down links

Mobile:
- horizontally safe charts
- stacked KPI and report navigation

## C7. Flows — Mockups 7 and 12
Rebuild:
- Flow library
- Flow cards/list
- create/sync/status controls
- builder workspace
- canvas
- inspector
- execution/submission visibility

Preserve Meta Flow integration and encryption/runtime behavior.

## C8. Templates — Mockups 8 and 13
Rebuild:
- KPI/status strip
- search/filter controls
- table/card library
- selected template preview
- right detail panel
- create/edit workflow
- Meta approval state presentation

Preserve sync/create/publish behavior.

## C9. Team Management — Mockup 9
Rebuild:
- team KPIs
- invite control
- member table/list
- role controls
- active/inactive state
- right insights/activity panel

Preserve role and workspace authorization.

## C10. Settings — Mockup 10
Rebuild:
- settings category rail
- focused setting content
- workspace profile
- service hours
- messaging settings
- AI/automation settings
- notifications
- collaboration
- Meta/platform settings
- account/usage block
- danger zone

Mobile:
- category selector becomes horizontal nav or drawer

## C11. Secondary reference screens — Mockups 11–13
Use the secondary analytics, automations/flows and templates references to tighten density, panel proportions and detail rails across the respective areas rather than treating them as duplicate pages.

---

# 6. Phase D — Rebuild All Remaining WhatsApp Screens

After the 13 mockup-driven surfaces are correct, rebuild every remaining route using the same design system.

Required screens:
- Overview
- Calls
- Saved Replies
- Phone Numbers
- Account
- Platform Administration
- nested analytics pages not already covered
- nested settings pages not already covered
- any route found in Phase A inventory

Each must use the same app shell, controls, spacing, panel hierarchy and responsive behavior.

**Phase D gate:** route inventory count must equal redesigned route count.

---

# 7. Phase E — Interaction and Routing Audit

For every visible control across every route, verify one of the following:
- executes a real existing handler
- opens a real modal/drawer/menu
- navigates to a real route
- is deliberately disabled with a real reason

Explicitly test:
- sidebar links
- mobile nav links
- page header actions
- create buttons
- edit buttons
- delete buttons
- filters
- tabs
- table row actions
- inspector actions
- builder controls
- settings save controls
- dialogs
- pagination
- back buttons
- deep links

Reject:
- `href="#"`
- empty hrefs
- JavaScript pseudo-links
- decorative buttons with no action
- routes that 404

---

# 8. Phase F — Responsive QA

Test at minimum these layout classes:
- narrow mobile ~360px
- standard mobile ~390–430px
- tablet ~768px
- compact desktop ~1024px
- standard desktop ~1366–1440px
- wide desktop ~1920px

Check:
- no horizontal page overflow
- no cut-off dialogs
- no inaccessible inspector panels
- no unusable builder controls
- tables convert appropriately
- bottom nav does not cover content
- composer remains usable
- sticky panels do not overlap
- sidebar/content widths remain stable after refresh

Historical regression check:
- repeatedly hard-refresh desktop WhatsApp routes
- verify viewport width does not expand until resize

---

# 9. Phase G — Functional Regression Gate

After visual rebuild is complete, run:

1. `npm run test:whatsapp`
2. `npx tsc --noEmit`
3. scoped ESLint for WhatsApp app/components/libs
4. route-governance/sitemap validation
5. internal-route regression tests
6. `npm run build`

Also verify:
- Stage 11 tenant isolation unchanged
- owner/manager/agent permissions unchanged
- no Supabase schema change introduced
- no Meta API behavior changed
- no AI spending control changed
- no campaign/automation/Flow backend behavior changed

Any regression reopens the affected page/component.

---

# 10. Phase H — Visual Acceptance Gate

Automated checks do not close this phase.

For every major route:
- render desktop view
- render mobile view
- compare against matching mockup or established design-system reference
- inspect opened menus
- inspect modal/dialog states
- inspect drawers
- inspect table/list selected states
- inspect empty/loading/error states
- inspect builder palette/canvas/inspector
- inspect logo rendering

Create a visual QA checklist with PASS / FIX for every route.

A route cannot be marked PASS if:
- legacy UI dominates
- spacing/proportions visibly miss the reference
- panel composition is wrong
- mobile is merely compressed desktop
- important controls are visually inconsistent
- the page technically works but visibly looks unfinished

If browser tooling is unavailable, use Vercel preview plus user screenshots for this gate. Do not claim visual verification from source inspection alone.

---

# 11. Completion Matrix

Use this table in the document as work progresses. `NOT STARTED`, `IN PROGRESS`, `FUNCTIONAL PASS`, `VISUAL PASS` are the only allowed states.

| Screen | Reference | Desktop | Mobile | Functionality | Visual QA |
|---|---|---|---|---|---|
| App Shell | Shared | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Conversations | Mockup 1 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Contacts / CRM | Mockup 2 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Automations Hub | Mockup 3 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Automation Builder | Mockup 4 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Campaigns | Mockup 5 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Analytics | Mockups 6,11 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Flows | Mockups 7,12 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Templates | Mockups 8,13 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Team | Mockup 9 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Settings | Mockup 10 | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Overview | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Calls | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Saved Replies | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Phone Numbers | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Account | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |
| Platform Admin | Shared system | NOT STARTED | NOT STARTED | NOT STARTED | NOT STARTED |

The matrix must be updated as work proceeds. No blanket “Stage 12 complete” statement is allowed while any row lacks `VISUAL PASS`.

---

# 12. Release Gate

Only after every completion-matrix row reaches `VISUAL PASS` and all regression gates are green:

1. Update completion documentation with exact test/build evidence.
2. Compare V2 branch against `main` and confirm no unrelated feature work slipped in.
3. Open one PR to `main`.
4. Merge once.
5. Allow one production deployment.
6. Confirm Vercel deployment is READY.
7. Smoke-test key production routes.
8. Check runtime errors.
9. Verify the production logo/assets.
10. Record production commit and deployment ID.

---

# 13. Definition of Done

Stage 12 V2 is done only when:
- every WhatsApp route has been structurally rebuilt into the approved app design language;
- the 13 mockup references are recognisable in their corresponding screens;
- desktop and mobile both pass visual QA;
- all buttons/routes/features still work;
- the full regression suite is green;
- the user has not rejected the visual result;
- and only then is the branch merged to production.
