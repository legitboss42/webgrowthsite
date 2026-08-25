import test from "node:test";
import assert from "node:assert/strict";
import {
  WHATSAPP_NAV_ITEMS,
  findWhatsAppNavItem,
  getWhatsAppPageMeta,
  getWhatsAppSenderStatusText,
  isWhatsAppNavItemActive,
  normalizeWhatsAppPath,
} from "./nav";
import { isConsoleRoute } from "../SiteChrome";

test("normalizeWhatsAppPath strips trailing slashes and query strings", () => {
  assert.equal(normalizeWhatsAppPath("/admin/whatsapp/"), "/admin/whatsapp");
  assert.equal(normalizeWhatsAppPath("/admin/whatsapp/?filter=HOT"), "/admin/whatsapp");
  assert.equal(normalizeWhatsAppPath(undefined), "");
});

test("the console root is active only on the root itself", () => {
  assert.equal(isWhatsAppNavItemActive("/admin/whatsapp", "/admin/whatsapp"), true);
  assert.equal(isWhatsAppNavItemActive("/admin/whatsapp/", "/admin/whatsapp"), true);
  assert.equal(isWhatsAppNavItemActive("/admin/whatsapp/contacts", "/admin/whatsapp"), false);
});

test("child routes stay active for their own section", () => {
  assert.equal(
    isWhatsAppNavItemActive("/admin/whatsapp/contacts", "/admin/whatsapp/contacts"),
    true,
  );
  assert.equal(
    isWhatsAppNavItemActive("/admin/whatsapp/contacts/abc", "/admin/whatsapp/contacts"),
    true,
  );
  assert.equal(
    isWhatsAppNavItemActive("/admin/whatsapp/templates", "/admin/whatsapp/contacts"),
    false,
  );
});

test("the inbox route resolves to the Conversations nav entry", () => {
  const item = findWhatsAppNavItem("/admin/whatsapp/conversations/?filter=HOT&lead=1");
  assert.equal(item?.label, "Conversations");
  assert.equal(getWhatsAppPageMeta("/admin/whatsapp/conversations/").title, "Conversations");
});

test("the console root resolves to Overview, not Conversations", () => {
  assert.equal(getWhatsAppPageMeta("/admin/whatsapp").title, "Overview");
  assert.equal(getWhatsAppPageMeta("/admin/whatsapp/").title, "Overview");
});

test("unknown console routes fall back to a neutral page title", () => {
  assert.equal(getWhatsAppPageMeta("/admin/whatsapp/not-a-route").title, "WhatsApp");
});

test("only routes that exist today are marked live", () => {
  const live = WHATSAPP_NAV_ITEMS.filter((item) => item.status === "live").map((item) => item.href);
  assert.deepEqual(live, ["/admin/whatsapp", "/admin/whatsapp/conversations"]);
});

test("sender status text reflects real configuration only", () => {
  assert.equal(getWhatsAppSenderStatusText(true), "Sender connected");
  assert.equal(getWhatsAppSenderStatusText(false), "Sender not configured");
});

test("marketing chrome is hidden on admin consoles and kept on public routes", () => {
  assert.equal(isConsoleRoute("/admin/whatsapp/"), true);
  assert.equal(isConsoleRoute("/admin"), true);
  assert.equal(isConsoleRoute("/"), false);
  assert.equal(isConsoleRoute("/scheduler"), false);
  assert.equal(isConsoleRoute("/administration"), false);
});
