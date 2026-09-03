# Stage 12 — App Experience Redesign: Approved Mockup Direction

Last updated: 2026-09-03

## Purpose

Stage 12 is the final product-experience redesign of the Web Growth WhatsApp Business Platform. The platform must feel like a dedicated messaging and marketing application, not a website or a generic admin dashboard.

All functionality already built in Stages 1–11 must retain a clear place in the redesigned application. Stage 12 is primarily an application-shell, information-architecture, density, consistency, responsiveness and interaction redesign. It must not casually remove or rebuild working backend behavior.

## Execution lock for this redesign

The user has now supplied the Web Growth logo plus the full 13-page mockup set as the visual reference for implementation. Treat those references as the approved design direction for the entire WhatsApp application, including every existing routed page and mobile view.

Non-negotiable implementation rules:

- Frontend redesign only. Do not remove, rename, replace or silently alter working backend features, APIs, database behavior, tenancy boundaries, permissions, Meta integration, automation runtime, campaign runtime, Flow runtime, AI runtime or Supabase schema unless a pre-existing defect makes a minimal compatible frontend fix impossible.
- Preserve every existing feature and expose it in the redesigned application.
- Every visible interactive control must either perform its existing action or route to the correct existing destination. No decorative dead buttons, fake tabs, placeholder links or broken feature controls.
- Every existing WhatsApp route must remain reachable and correctly governed. New frontend routes introduced only for UX composition must be registered in route governance where required.
- Build responsive layouts deliberately. Mobile is not a scaled-down desktop screenshot. Navigation, Inbox, chat, CRM, builders, tables, detail panels and settings must each have intentional small-screen behavior.
- Use the uploaded Web Growth logo in the application shell where appropriate. Do not substitute the mockup's generated WG mark when the real supplied logo is available.
- The mockups guide composition, density, hierarchy, visual language and interaction placement. Mockup sample names, counts, dates, metrics and fictional content must never replace live application data.
- Maintain accessibility: semantic structure, keyboard operability, focus visibility, labels, dialogs/drawers, contrast and touch targets.
- Preserve Core Web Vitals and avoid unnecessary heavy animation. CSS-first interactions are preferred.
- Fix the known desktop refresh width/layout instability as part of the shared shell work.
- Do not deploy any Stage 12 implementation to Vercel production until the entire redesign is completed, route-checked, regression-tested, responsive-tested and explicitly ready as one finished stage. Development work must stay off `main` until that gate.

Stage 12 implementation branch: `stage12-app-redesign`.

## Approved visual direction

The current mockup direction is approved as the basis for continued Stage 12 exploration:

- dark application UI
- near-black / very dark navy application background
- charcoal panel and workspace surfaces
- Web Growth green as the primary brand/accent colour
- white and neutral-grey typography
- thin borders and restrained elevation rather than oversized website-style cards
- dense, task-oriented desktop layouts
- persistent application navigation
- full-screen application workspaces where appropriate
- clear selected, active, success and online states using green
- secondary semantic colours may be used sparingly where required for warnings, errors, information, charts or workflow differentiation
- PURPLE IS NOT PART OF THE APPROVED STAGE 12 VISUAL DIRECTION and should not be used as a recurring brand/accent colour
- avoid the generic purple-gradient SaaS-template appearance
- design should feel like a messaging + marketing operations application

## Mockup presentation rule

Mockups are to be generated and reviewed as individual, bold, full-size page images. Do not combine multiple platform pages into a single collage/design board when reviewing individual page designs.

The mockups are design references, not literal implementation specifications. Generated labels, example data, colours or duplicated screens must not override the actual product architecture or existing functionality.

## Platform areas that must have a place in the redesign

The Stage 12 application architecture must accommodate the functionality already built across the project, including:

1. Conversations / Inbox
   - conversation list
   - live chat workspace
   - customer/contact context
   - assignment and status controls
   - tags and CRM information
   - internal notes
   - attachments / media / voice-note capable composer
   - typing/read/delivery/service-window states where supported
   - AI Assist and human/AI handling controls

2. Contacts / CRM
   - contacts
   - CRM stages
   - tags
   - custom fields
   - contact history
   - segmentation and relevant campaign/automation context

3. Automations Hub
   - workflow list and lifecycle states
   - runtime information
   - AI Agent visibility/integration where appropriate

4. Automation Builder
   - visual workflow canvas
   - triggers, conditions and actions
   - configuration panels
   - run/test/history controls

5. Campaigns & Broadcasts
   - campaign list
   - audiences/segments
   - lifecycle/status
   - delivery/read/click/failure performance
   - campaign creation and reporting

6. WhatsApp Flows
   - Flow management
   - Meta Flow state/version information
   - Flow launch/submission/runtime information
   - Flow editing/builder experience where supported

7. Message Templates
   - Meta template list
   - category/language/status/quality information
   - drafts and creation/editing
   - submission/status refresh
   - test-send and duplication where supported

8. AI Agents
   - AI Agent definitions
   - active/draft/paused states
   - knowledge and instructions
   - action permissions
   - testing/sandbox
   - usage and handoff information

9. Analytics & Reports
   - executive KPIs
   - conversations/backlog/response metrics
   - message/call analytics
   - team attribution
   - CRM distributions
   - automation performance/failures
   - campaign funnel analytics
   - Flow analytics
   - AI usage/performance where available
   - operational drill-downs

10. Team Management
    - members
    - workspace roles and permissions
    - assignment/activity/availability information where supported
    - invitations/password access flows

11. Workspace Settings
    - General / Business Profile
    - WhatsApp connection
    - Inbox & Messaging
    - Business Hours
    - Lead & CRM
    - Team & Assignment
    - Notifications
    - Automation
    - AI
    - Campaigns
    - Templates & Flows
    - Integrations & API
    - Data & Privacy
    - Security
    - Danger Zone

12. Platform Administration / Multi-Business SaaS
    - workspace management
    - platform identities
    - workspace switching/context
    - plans/entitlements
    - Meta connection infrastructure
    - platform-level email/AI/security/system/audit/feature controls as implemented or introduced during commercialisation

13. Responsive / mobile application experience
    - especially Inbox and conversation handling
    - deliberate mobile navigation rather than a shrunk desktop website
    - preserve essential CRM, assignment and messaging actions

## Full-page reference set supplied by user

The uploaded reference set covers these visual areas and should be mapped to the real routed product rather than copied literally:

1. Conversations / Inbox
2. Contacts / CRM
3. Automations Hub
4. Automation Builder
5. Campaigns / Broadcasts
6. Analytics & Reports
7. WhatsApp Flows
8. Message Templates
9. Team Management
10. Business / Workspace Settings
11. Analytics & Reports secondary reference
12. Automations & Flows secondary reference
13. Templates secondary reference

Where the mockups duplicate an area, use the strongest patterns from both while preserving the real product's current feature set. AI Agents and platform administration must still receive the same shell/design treatment even where a unique uploaded page is not present.

## Current mockup exploration checkpoint

A sequence of numbered dark-theme mockups has been generated during Stage 12 design exploration. The useful visual direction includes concepts for:

- Conversations / Inbox
- Contacts / CRM
- Automations Hub
- Automation Builder
- Campaigns / Broadcasts
- Analytics
- WhatsApp Flows
- Message Templates
- AI Agents
- Team Management
- Settings
- supporting automation/reporting/template views

Some generated images drifted in numbering, duplicated existing areas, or accidentally introduced purple accents. Those mistakes are NOT product requirements. The approved direction is the consistent dark Web Growth application shell described in this document.

## Stage 12 implementation sequence

1. Inventory every existing WhatsApp page, nested route, action, tab, dialog, drawer and navigation target on `main`.
2. Establish shared design tokens and the fixed responsive application shell first.
3. Integrate the real Web Growth logo and workspace/user navigation.
4. Migrate each routed area into the new shell without changing feature contracts.
5. Rebuild desktop and mobile layouts together, not as separate late passes.
6. Audit every visible button/link/control against a real route or existing action.
7. Run route governance, unit/integration tests, TypeScript, eslint and production build checks.
8. Regression-test all Stage 1–11 functionality impacted by changed frontend components.
9. Test responsive widths and repeated hard refreshes, including the known width instability.
10. Only when the whole Stage 12 frontend is complete and verified should it be eligible to merge to `main` and deploy once.

## Stage 12 implementation principle

Before implementing the redesign, use the approved mockups to settle the shared application shell and design system first. Then migrate existing modules into that system without changing proven APIs, tenancy boundaries, permissions or backend behavior unless a specific functional defect requires it.

Stage 11 tenant isolation remains authoritative and must be preserved throughout Stage 12.

## Current implementation issue to retain in Stage 12 backlog

Desktop WhatsApp pages currently have a refresh-related width/layout issue: after refreshing a WhatsApp page, content can widen until the browser window is minimized/maximized or otherwise resized. A first shell width guard did not fully resolve the issue. Treat this as a global application-shell defect and verify the final Stage 12 shell against repeated reload/hard-refresh behavior on multiple WhatsApp pages and desktop viewport sizes.
