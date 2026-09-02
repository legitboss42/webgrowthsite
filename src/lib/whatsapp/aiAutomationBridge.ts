import { mutateWhatsAppRest, readWhatsAppRows } from "@/app/admin/whatsapp/data";
import { normalizeWhatsAppAIAgent } from "./aiModel";
import { generateWhatsAppAI } from "./aiRuntime";

function text(value: unknown, max = 200) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function stringArray(value: unknown) {
  return Array.isArray(value) ? value.map((item) => text(item, 120)).filter(Boolean) : [];
}
export function whatsappAIAgentAutomationSlug(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);
}
export function whatsappAIAgentAutomationTag(value: string) {
  return `AI_AGENT:${whatsappAIAgentAutomationSlug(value)}`;
}

async function patchTags(contactId: string, tags: string[]) {
  await mutateWhatsAppRest({
    method: "PATCH",
    pathAndQuery: `whatsapp_contacts?id=eq.${encodeURIComponent(contactId)}`,
    body: { tags, updated_at: new Date().toISOString() },
  });
}

/**
 * Bridge Stage 6 into Stage 10 without teaching the proven automation engine a second
 * action language. Existing Add Tag steps can emit one-shot AI control tags:
 * - AI_AGENT:<agent-slug> assigns an Active AI Agent for subsequent customer turns.
 * - AI_SUMMARY creates a private AI conversation summary note.
 *
 * Control tags are consumed after a successful routing/attempt so a human takeover
 * stays a human takeover and summary requests cannot loop forever.
 */
export async function processWhatsAppAIAutomationTags(input: { waId: string }) {
  const contacts = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_contacts?wa_id=eq.${encodeURIComponent(input.waId.replace(/^\+/, ""))}&select=id,tags&limit=1`,
  );
  const contact = contacts?.[0];
  const contactId = text(contact?.id, 100);
  const tags = stringArray(contact?.tags);
  if (!contactId || !tags.length) return { assigned: false, summarized: false };

  const assignmentTag = tags.find((tag) => tag.toUpperCase().startsWith("AI_AGENT:"));
  const summaryTag = tags.find((tag) => tag.toUpperCase() === "AI_SUMMARY");
  if (!assignmentTag && !summaryTag) return { assigned: false, summarized: false };

  const conversations = await readWhatsAppRows<Record<string, unknown>>(
    `whatsapp_conversations?contact_id=eq.${encodeURIComponent(contactId)}&status=eq.open&select=id&order=last_message_at.desc&limit=1`,
  );
  const conversationId = text(conversations?.[0]?.id, 100);
  if (!conversationId) return { assigned: false, summarized: false };

  let assigned = false;
  let summarized = false;
  const consumed = new Set<string>();

  if (assignmentTag) {
    const wanted = assignmentTag.slice(assignmentTag.indexOf(":") + 1).trim().toLowerCase();
    const rows = await readWhatsAppRows<Record<string, unknown>>(
      "whatsapp_ai_agents?status=eq.ACTIVE&select=*&order=updated_at.desc&limit=200",
    );
    const agent = (rows || []).map(normalizeWhatsAppAIAgent).find((candidate) => {
      return candidate.id.toLowerCase() === wanted || whatsappAIAgentAutomationSlug(candidate.name) === wanted;
    });
    if (agent) {
      const result = await mutateWhatsAppRest({
        method: "PATCH",
        pathAndQuery: `whatsapp_conversations?id=eq.${encodeURIComponent(conversationId)}`,
        body: {
          ai_agent_id: agent.id,
          ai_handling_mode: "AI",
          ai_turn_count: 0,
          human_review_required: false,
          updated_at: new Date().toISOString(),
        },
      });
      if (result.ok) {
        assigned = true;
        consumed.add(assignmentTag);
        await mutateWhatsAppRest({
          method: "POST",
          pathAndQuery: "whatsapp_team_activity",
          body: {
            conversation_id: conversationId,
            actor_member_id: null,
            actor_email: "ai@webgrowth.info",
            target_member_id: null,
            event_type: "ai_agent_assigned_by_automation",
            metadata: { agentId: agent.id, agentName: agent.name, controlTag: assignmentTag, contactId },
          },
        });
      }
    }
  }

  if (summaryTag) {
    const result = await generateWhatsAppAI({ feature: "SUMMARY", conversationId, saveSummary: true });
    summarized = result.ok;
    // Consume the one-shot request even when AI is currently budget/provider blocked;
    // otherwise every inbound message would retry and create an accidental loop.
    consumed.add(summaryTag);
    await mutateWhatsAppRest({
      method: "POST",
      pathAndQuery: "whatsapp_team_activity",
      body: {
        conversation_id: conversationId,
        actor_member_id: null,
        actor_email: "ai@webgrowth.info",
        target_member_id: null,
        event_type: result.ok ? "ai_summary_requested_by_automation" : "ai_summary_automation_blocked",
        metadata: { contactId, controlTag: summaryTag, error: result.ok ? null : result.error },
      },
    });
  }

  if (consumed.size) await patchTags(contactId, tags.filter((tag) => !consumed.has(tag)));
  return { assigned, summarized };
}
