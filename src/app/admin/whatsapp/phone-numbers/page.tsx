import type { Metadata } from "next";
import Link from "next/link";
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
  if (rating === "GREEN") return "border-ledger-bright/20 bg-ledger-tint text-ledger-bright";
  if (rating === "YELLOW") return "border-brass/20 bg-brass-tint text-brass";
  if (rating === "RED") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-rule bg-paper-sunk text-ink-faint";
}
function EmptyState({ title, children }: { title: string; children: React.ReactNode }) { return <div className="rounded-2xl border border-rule bg-paper-raised px-6 py-14 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-rule bg-paper-sunk text-ink-faint"><WhatsAppIcon name="phoneNumbers" className="h-6 w-6" /></span><p className="mt-4 text-base font-semibold text-ink">{title}</p><div className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink-faint">{children}</div></div>; }
function Row({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start gap-4 border-t border-rule py-3 text-sm first:border-t-0"><dt className="text-ink-faint">{label}</dt><dd className="min-w-0 break-words text-right text-ink">{value}</dd></div>; }
function PhoneNumberCard({ number, isConfiguredSender }: { number: WhatsAppPhoneNumber; isConfiguredSender: boolean }) {
  const verified = number.codeVerificationStatus?.toUpperCase() === "VERIFIED"; const live = number.accountMode?.toUpperCase() === "LIVE";
  return <article className={`rounded-2xl border bg-paper-raised p-5 transition ${isConfiguredSender ? "border-ledger-bright/35 shadow-[0_0_0_1px_rgba(22,198,90,.08)]" : "border-rule hover:border-rule-strong"}`}><div className="flex flex-wrap items-start gap-3"><span className={`grid h-11 w-11 flex-none place-items-center rounded-xl border ${isConfiguredSender ? "border-ledger-bright/20 bg-ledger-tint text-ledger-bright" : "border-rule bg-paper-sunk text-ink-faint"}`}><WhatsAppIcon name="phoneNumbers" className="h-5 w-5" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-mono text-base font-semibold text-ink">{number.displayPhoneNumber || "Number not returned"}</h2>{isConfiguredSender ? <span className="rounded-full border border-ledger-bright/20 bg-ledger-tint px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[.08em] text-ledger-bright">Primary sender</span> : null}</div><p className="mt-1 truncate text-xs text-ink-faint">{number.verifiedName || "No verified name"}</p></div><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${getQualityClasses(number.qualityRating)}`}>{describeWhatsAppQuality(number.qualityRating)} quality</span></div><dl className="mt-5 rounded-xl border border-rule bg-paper px-4"><Row label="Messaging limit" value={describeWhatsAppMessagingTier(number.messagingLimitTier) || "—"}/><Row label="Verification" value={<span className={verified?"font-medium text-ledger-bright":"text-ink-faint"}>{humanizeWhatsAppEnum(number.codeVerificationStatus)||"—"}</span>}/><Row label="Account mode" value={<span className={live?"font-medium text-ledger-bright":"text-ink-faint"}>{humanizeWhatsAppEnum(number.accountMode)||"—"}</span>}/><Row label="Display-name status" value={humanizeWhatsAppEnum(number.nameStatus)||"—"}/><Row label="Platform" value={humanizeWhatsAppEnum(number.platformType)||"—"}/><Row label="Throughput" value={humanizeWhatsAppEnum(number.throughputLevel)||"—"}/><Row label="Official business account" value={number.isOfficialBusinessAccount===undefined?"—":number.isOfficialBusinessAccount?"Yes":"No"}/><Row label="Webhook" value={number.webhookUrl?<span className="break-all font-mono text-xs text-ink-soft">{number.webhookUrl}</span>:<span className="text-ink-faint">Not set on this number</span>}/><Row label="Phone number ID" value={<span className="font-mono text-xs text-ink-soft">{number.id}</span>}/></dl></article>;
}

export default async function WhatsAppPhoneNumbersPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || access.role !== "owner") return <div className="px-4 py-12 sm:px-6"><div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">Workspace Owner access is required for phone-number diagnostics.</div></div>;

  const [result, configured] = await Promise.all([fetchWhatsAppPhoneNumbers({ workspaceId: access.workspaceId }), resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId })]);
  if (!result.ok) return <div className="p-3 sm:p-5 lg:p-6">{result.reason === "NOT_CONFIGURED" ? <EmptyState title="Phone numbers are not configured">Connect this workspace to its Meta WhatsApp Business Account from the platform workspace manager.</EmptyState> : result.reason === "PERMISSION_DENIED" ? <EmptyState title="Meta refused the request">The workspace access token was rejected or cannot read this WhatsApp Business Account.</EmptyState> : <EmptyState title="Could not reach Meta">The Graph API did not return the phone numbers. The server log has the provider detail.</EmptyState>}</div>;

  const primary = result.phoneNumbers.find((number) => Boolean(configured?.phoneNumberId) && number.id === configured?.phoneNumberId);
  return <div className="w-full p-3 sm:p-5 lg:p-6">
    <header className="mb-5 flex flex-col gap-4 border-b border-rule pb-5 xl:flex-row xl:items-end xl:justify-between"><div><div className="mb-2 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[.16em] text-ledger-bright"><span className="h-1.5 w-1.5 rounded-full bg-ledger-bright" />Meta connection</div><h1 className="text-2xl font-semibold text-ink sm:text-3xl">Phone numbers</h1><p className="mt-1 max-w-2xl text-sm leading-6 text-ink-faint">Inspect sender identity, verification, quality and throughput for numbers attached to this workspace.</p></div><div className="flex flex-wrap gap-2"><Link href="/admin/whatsapp/settings/#connection" className="inline-flex items-center gap-2 rounded-xl border border-rule bg-paper-raised px-3.5 py-2.5 text-xs font-semibold text-ink-soft hover:border-rule-strong hover:text-ink"><WhatsAppIcon name="settings" className="h-4 w-4" />Connection settings</Link><span className="inline-flex items-center gap-2 rounded-xl border border-ledger-bright/25 bg-ledger-tint px-3.5 py-2.5 text-xs font-semibold text-ledger-bright"><span className="h-2 w-2 rounded-full bg-ledger-bright" />{result.phoneNumbers.length} connected</span></div></header>

    {primary ? <section className="mb-4 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Primary sender</p><p className="mt-2 truncate font-mono text-lg font-semibold text-ink">{primary.displayPhoneNumber || primary.id}</p></div><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Quality</p><p className="mt-2 text-lg font-semibold text-ink">{describeWhatsAppQuality(primary.qualityRating)}</p></div><div className="rounded-2xl border border-rule bg-paper-raised p-4"><p className="text-[0.62rem] font-semibold uppercase tracking-[.14em] text-ink-faint">Messaging tier</p><p className="mt-2 text-lg font-semibold text-ink">{describeWhatsAppMessagingTier(primary.messagingLimitTier) || "Not returned"}</p></div></section> : null}

    {result.phoneNumbers.length===0?<EmptyState title="No phone numbers on this account">Numbers added to this workspace&apos;s WhatsApp Business Account will appear here.</EmptyState>:<section className="grid gap-4 xl:grid-cols-2">{result.phoneNumbers.map((number)=><PhoneNumberCard key={number.id} number={number} isConfiguredSender={Boolean(configured?.phoneNumberId)&&number.id===configured?.phoneNumberId}/>)}</section>}
    <p className="mt-4 rounded-xl border border-rule bg-paper-raised px-4 py-3 text-xs leading-5 text-ink-faint">This workspace is read-only for Meta-controlled quality ratings and messaging limits. Operational configuration lives under Settings.</p>
  </div>;
}
