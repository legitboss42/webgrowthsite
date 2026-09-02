import type { Metadata } from "next";
import { cookies } from "next/headers";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";
import { isWhatsAppFlowEncryptionConfigured } from "@/lib/whatsapp/flowCrypto";
import { normalizeWhatsAppFlowRow, normalizeWhatsAppFlowSubmissionRow, type WhatsAppFlow, type WhatsAppFlowSubmission } from "@/lib/whatsapp/flowModel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { readWhatsAppRows } from "../data";
import FlowManager from "../FlowManager";

export const metadata: Metadata = { title: "WhatsApp Flows | Web Growth", robots: { index: false, follow: false } };

async function getFlows(): Promise<{ flows: WhatsAppFlow[]; ready: boolean }> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flows?select=*&order=updated_at.desc&limit=500");
  if (rows === null) return { flows: [], ready: false };
  return { flows: rows.map(normalizeWhatsAppFlowRow), ready: true };
}
async function getSubmissions(): Promise<WhatsAppFlowSubmission[]> {
  const rows = await readWhatsAppRows<Record<string, unknown>>("whatsapp_flow_submissions?select=*&order=created_at.desc&limit=500");
  return (rows || []).map(normalizeWhatsAppFlowSubmissionRow);
}

export default async function WhatsAppFlowsPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">Owner or Manager access is required to manage WhatsApp Flows.</div></div>;
  const [flowResult, submissions] = await Promise.all([getFlows(), getSubmissions()]);
  return <div className="px-3 py-4 sm:px-5 sm:py-5"><FlowManager flows={flowResult.flows} submissions={submissions} storageReady={flowResult.ready} role={access.role} encryptionConfigured={isWhatsAppFlowEncryptionConfigured()} /></div>;
}
