# Stage 12 full redesign rework

Updated: 2026-09-03

## Status

Stage 12 is REOPENED and is not eligible for production promotion yet.

The first Stage 12 implementation passed automated validation but was visually too close to the old frontend with a dark colour/theme layer. The user explicitly rejected that as insufficient. The required result is a full app-interface redesign based on the supplied mockups, including component treatment and not merely colours.

## Rework requirements

- Redesign buttons, action controls, fields, tabs, filters, cards, data tables, badges, menus, dialogs, builders, navigation and mobile controls.
- Preserve every existing feature, route, API, permission and backend contract.
- Keep Web Growth green as the primary accent and do not reintroduce recurring purple branding.
- Keep the application full-width and task-oriented rather than centered like a website.
- Make desktop and mobile layouts intentional.
- The supplied Web Growth logo must render reliably in the application shell.
- No production deployment until the reworked frontend is complete and validated.

## Current corrective implementation

- Added `stage12-components.css`, a WhatsApp-scoped component system that changes control geometry, elevation, density, buttons, secondary/destructive actions, forms, KPI/panel treatment, tabs, tables, menus, dialogs, builder canvases and mobile behavior across existing routes.
- Added `stage12-logo-fix.css` to bypass the Next Image optimization path for the embedded supplied logo asset and load the public asset directly in the shell brand mark.
- Imported both layers from the WhatsApp layout only, leaving the public Web Growth site untouched.

## Gate

Do not mark Stage 12 complete merely because tests/build pass. Completion now requires the full component redesign to be implemented across the platform and the final branch head to pass WhatsApp tests, TypeScript, scoped eslint and the production build. Production merge/deployment remains a separate final action.
