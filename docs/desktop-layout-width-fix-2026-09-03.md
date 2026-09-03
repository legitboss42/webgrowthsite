# Desktop WhatsApp layout width fix — 2026-09-03

## Reported issue

On desktop, reloading the WhatsApp workspace could cause the page contents to widen beyond the expected application width. Minimizing and maximizing the browser forced a resize and returned the layout to the correct width. Other browser tabs were unaffected, indicating an application layout regression rather than a browser-wide issue.

## Root layout risk

The desktop WhatsApp shell combines a fixed `w-64` sidebar with a flex-growing application column. Although the application column already used `min-w-0`, descendants with intrinsic or viewport-based width could still influence the flex item's initial sizing during reload and allow horizontal expansion until a browser resize recalculated the layout.

## Fix

Updated `src/components/whatsapp/WhatsAppShell.tsx` to make the desktop application shell width deterministic:

- constrain the root shell with `w-full max-w-full` and block horizontal overflow
- use a `w-0 min-w-0 flex-1` application column so the fixed desktop sidebar is always subtracted from the available viewport width
- constrain the header, header content, toolbar wrapper, and child-content host with `w-full` / `max-w-full`
- preserve the existing desktop fixed sidebar and all mobile navigation behavior
- keep viewport-filling routes vertically clipped without relying on horizontal `overflow-hidden` as the only width guard

## Scope

This change is limited to the WhatsApp application shell. It does not modify APIs, authentication, tenant scoping, messaging behavior, mobile navigation, or individual feature modules.

## Validation target

Desktop production/preview verification should confirm that repeated hard reloads keep the sidebar and content within the viewport without requiring minimize/maximize or any manual resize event.
