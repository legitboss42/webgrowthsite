import assert from "node:assert/strict";
import test from "node:test";
import {
  createSupabaseWhatsAppStore,
  getSupabaseWhatsAppReplyContext,
} from "./store";
import { runWithWhatsAppWorkspace } from "./workspaceContext";

const workspaceId = "514d88ca-3b92-4225-ae4c-b23cef26a611";

test("Supabase outbound writes inherit the active WhatsApp workspace", async () => {
  const requests: Array<{ url: string; method: string; body: string }> = [];

  await runWithWhatsAppWorkspace(workspaceId, async () => {
    const store = createSupabaseWhatsAppStore({
      url: "https://example.supabase.co",
      serviceRoleKey: "test-key",
      fetch: async (url, init) => {
        requests.push({
          url: String(url),
          method: init?.method || "GET",
          body: String(init?.body || ""),
        });
        return new Response(JSON.stringify([{ id: "row-1" }]), { status: 200 });
      },
    });

    await store.recordOutbound({
      conversationId: "conversation-1",
      messageId: "wamid.outbound-workspace-1",
      waId: "2348012345678",
      text: "Scoped reply",
      timestamp: 1_800_000_000,
    });
  });

  const conversationPatch = requests.find((request) => request.url.includes("whatsapp_conversations"));
  const messageInsert = requests.find((request) => request.url.includes("whatsapp_messages"));

  assert.ok(conversationPatch);
  assert.ok(messageInsert);
  assert.match(conversationPatch.url, new RegExp(`workspace_id=eq\\.${workspaceId}`));
  assert.match(conversationPatch.body, new RegExp(`"workspace_id":"${workspaceId}"`));
  assert.match(messageInsert.body, new RegExp(`"workspace_id":"${workspaceId}"`));
});

test("reply context reads inherit the active WhatsApp workspace", async () => {
  const urls: string[] = [];

  const context = await runWithWhatsAppWorkspace(workspaceId, () => getSupabaseWhatsAppReplyContext(
    {
      url: "https://example.supabase.co",
      serviceRoleKey: "test-key",
      fetch: async (url) => {
        const target = String(url);
        urls.push(target);
        if (target.includes("whatsapp_conversations")) {
          return new Response(JSON.stringify([{ id: "conversation-1", status: "open", whatsapp_contacts: { wa_id: "2348012345678" } }]), { status: 200 });
        }
        return new Response(JSON.stringify([{ whatsapp_message_id: "wamid.inbound-1", message_timestamp: "2026-09-07T10:00:00.000Z" }]), { status: 200 });
      },
    },
    "conversation-1",
    "2348012345678",
  ));

  assert.ok(context);
  assert.equal(urls.length, 2);
  assert.match(urls[0] || "", new RegExp(`workspace_id=eq\\.${workspaceId}`));
  assert.match(urls[1] || "", new RegExp(`workspace_id=eq\\.${workspaceId}`));
});
