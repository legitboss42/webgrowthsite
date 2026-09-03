# Stage 12 — App Experience Redesign: Approved Mockup Direction

Last updated: 2026-09-03

## Purpose

Stage 12 is the final product-experience redesign of the Web Growth WhatsApp Business Platform. The platform must feel like a dedicated messaging and marketing application, not a website or a generic admin dashboard.

All functionality already built in Stages 1–11 must retain a clear place in the redesigned application. Stage 12 is primarily an application-shell, information-architecture, density, consistency, responsiveness and interaction redesign. It must not casually remove or rebuild working backend behavior.

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

## Stage 12 implementation principle

Before implementing the redesign, use the approved mockups to settle the shared application shell and design system first. Then migrate existing modules into that system without changing proven APIs, tenancy boundaries, permissions or backend behavior unless a specific functional defect requires it.

Stage 11 tenant isolation remains authoritative and must be preserved throughout Stage 12.

## Current implementation issue to retain in Stage 12 backlog

Desktop WhatsApp pages currently have a refresh-related width/layout issue: after refreshing a WhatsApp page, content can widen until the browser window is minimized/maximized or otherwise resized. A first shell width guard did not fully resolve the issue. Treat this as a global application-shell defect and verify the final Stage 12 shell against repeated reload/hard-refresh behavior on multiple WhatsApp pages and desktop viewport sizes.
