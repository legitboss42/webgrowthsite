import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import {
  describeWhatsAppMessagingTier,
  describeWhatsAppQuality,
  fetchWhatsAppPhoneNumbers,
  humanizeWhatsAppEnum,
  type WhatsAppPhoneNumber,
  type WhatsAppQualityRating,
} from "@/lib/whatsapp/phoneNumbers";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";
import { getWhatsAppWorkspaceAccess } from "../auth";

export const metadata: Metadata = { title: "WhatsApp Phone Numbers | Web Growth", robots: { index: false, follow: false } };

function getQualityClasses(rating: WhatsAppQualityRating) {
  if (rating === "GREEN") return "bg-ledger-tint text-ledger ring-1 ring-ledger/15";
  if (rating === "YELLOW") return "bg-brass-tint text-[#6f4f16] ring-1 ring-brass/25";
  if (rating === "RED") return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
  return "bg-paper-sunk text-ink-faint ring-1 ring-rule";
}
function EmptyState({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-xl border border-rule bg-paper-raised px-6 py-12 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-paper-sunk text-ink-faint"><WhatsAppIcon name="phoneNumbers" className="h-6 w-6" /></span><p className="mt-3 text-sm font-medium text-ink">{title}</p><div className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink-faint">{children}</div></div>; }
function Row({ label, value }: { label: string; value: React.ReactNode }) { return <div className="flex items-start justify-between gap-3 border-t border-rule py-2.5 text-sm first:border-t-0"><dt className="flex-none text-ink-faint">{label}</dt><dd className="min-w-0 break-words text-right text-ink">{value}</dd></div>; }
function PhoneNumberCard({ number, isConfiguredSender }: { number: WhatsAppPhoneNumber; isConfiguredSender: boolean }) {
  const verified = number.codeVerificationStatus?.toUpperCase() === "VERIFIED"; const live = number.accountMode?.toUpperCase() === "LIVE";
  return <article className="rounded-xl border border-rule bg-paper-raised p-5"><div className="flex flex-wrap items-start gap-2"><div className="min-w-0 flex-1"><h2 className="truncate font-mono text-base font-semibold text-ink">{number.displayPhoneNumber || "Number not returned"}</h2><p className="mt-0.5 truncate text-xs text-ink-faint">{number.verifiedName || "No verified name"}</p></div><div className="flex flex-none flex-wrap gap-1.5">{isConfiguredSender ? <span className="rounded-full bg-ledger px-2.5 py-1 text-[0.65rem] font-semibold text-on-dark">Workspace sender</span> : null}<span className={`rounded-full px-2.5 py-1 text-[0.65rem] font-semibold ${getQualityClasses(number.qualityRating)}`}>{describeWhatsAppQuality(number.qualityRating)} quality</span></div></div><dl className="mt-4"><Row label="Messaging limit" value={describeWhatsAppMessagingTier(number.messagingLimitTier) || "—"}/><Row label="Verification" value={<span className={verified?"font-medium text-ledger":"text-ink-faint"}>{humanizeWhatsAppEnum(number.codeVerificationStatus)||"—"}</span>}/><Row label="Account mode" value={<span className={live?"font-medium text-ledger":"text-ink-faint"}>{humanizeWhatsAppEnum(number.accountMode)||"—"}</span>}/><Row label="Display-name status" value={humanizeWhatsAppEnum(number.nameStatus)||"—"}/><Row label="Platform" value={humanizeWhatsAppEnum(number.platformType)||"—"}/><Row label="Throughput" value={humanizeWhatsAppEnum(number.throughputLevel)||"—"}/><Row label="Official business account" value={number.isOfficialBusinessAccount===undefined?"—":number.isOfficialBusinessAccount?"Yes":"No"}/><Row label="Webhook" value={number.webhookUrl?<span className="break-all font-mono text-xs text-ink-soft">{number.webhookUrl}</span>:<span className="text-ink-faint">Not set on this number</span>}/><Row label="Phone number ID" value={<span className="font-mono text-xs text-ink-soft">{number.id}</span>}/></dl></article>;
}

export default async function WhatsAppPhoneNumbersPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || access.role !== "owner") return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">Workspace Owner access is required for phone-number diagnostics.</div></div>;

  const [result, configured] = await Promise.all([
    fetchWhatsAppPhoneNumbers({ workspaceId: access.workspaceId }),
    resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId }),
  ]);
  if (!result.ok) return <div className="px-4 py-5 sm:px-6 sm:py-6">{result.reason === "NOT_CONFIGURED" ? <EmptyState title="Phone numbers are not configured">Connect this workspace to its Meta WhatsApp Business Account from the platform workspace manager.</EmptyState> : result.reason === "PERMISSION_DENIED" ? <EmptyState title="Meta refused the request">The workspace access token was rejected or cannot read this WhatsApp Business Account.</EmptyState> : <EmptyState title="Could not reach Meta">The Graph API did not return the phone numbers. The server log has the provider detail.</EmptyState>}</div>;

  return <div className="px-4 py-5 sm:px-6 sm:py-6"><p className="text-xs text-ink-faint">{access.workspaceName} · live from Meta · <span className="tabular-nums">{result.phoneNumbers.length}</span> number{result.phoneNumbers.length===1?"":"s"}</p>{result.phoneNumbers.length===0?<div className="mt-4"><EmptyState title="No phone numbers on this account">Numbers added to this workspace&apos;s WhatsApp Business Account will appear here.</EmptyState></div>:<div className="mt-4 grid gap-4 xl:grid-cols-2">{result.phoneNumbers.map((number)=><PhoneNumberCard key={number.id} number={number} isConfiguredSender={Boolean(configured?.phoneNumberId)&&number.id===configured?.phoneNumberId}/>)}</div>}<p className="mt-4 rounded-lg bg-paper-raised px-3 py-2.5 text-xs leading-5 text-ink-faint">This page is read-only. Quality rating and messaging limits are controlled by Meta for this workspace&apos;s sender.</p></div>;
}
