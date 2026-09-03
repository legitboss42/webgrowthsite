# Desktop WhatsApp layout width fix — 2026-09-03

## Reported issue

On desktop, reloading any WhatsApp workspace page could cause the page contents to widen beyond the expected application width. Minimizing and maximizing the browser forced a resize and returned the layout to the correct width. Other browser tabs were unaffected, indicating an application layout regression rather than a browser-wide issue.

## First correction and verification result

The first correction constrained the shared shell with `w-full` / `max-w-full`, used `w-0 min-w-0 flex-1` for the application column, and added width guards to the header and content host. That build compiled and deployed successfully, but production/preview verification showed that the widening still occurred after refresh on every WhatsApp page.

Because the symptom reproduces across Settings, Automations, AI Agents, Conversations and other WhatsApp routes, the defect is global to the app frame rather than a single feature page or the inbox three-column layout.

## Revised fix

Updated `src/components/whatsapp/WhatsAppShell.tsx` so the desktop WhatsApp console is a viewport-bound application frame:

- keep the existing intrinsic-width guards (`w-full`, `max-w-full`, `w-0`, `min-w-0`)
- at the desktop breakpoint, bind the shell directly to the viewport with `lg:fixed lg:inset-0`
- remove the desktop shell from normal document-width calculation so a child cannot enlarge the application frame during hydration/reload
- allow ordinary WhatsApp pages to scroll inside the fixed desktop frame with `lg:overflow-y-auto`
- preserve the existing viewport-fill behavior for Conversations, including independent internal scrolling
- leave mobile behavior unchanged because the viewport binding only applies at `lg` and above

## Scope

This change is limited to the shared WhatsApp application shell. It does not modify APIs, authentication, tenant scoping, messaging behavior, feature modules, or mobile navigation.

## Validation target

Desktop production/preview verification should repeat refresh and hard-refresh tests across multiple WhatsApp routes. The app should remain exactly viewport width immediately after load, without requiring minimize/maximize, window resizing, or another browser-generated resize event.
