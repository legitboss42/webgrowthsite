import type { Metadata } from "next";
import { cookies } from "next/headers";
import { WhatsAppIcon } from "@/components/whatsapp/icons";
import { WorkspaceActionLink, WorkspaceStat, WorkspaceSurface, WorkspaceToolbar } from "@/components/whatsapp/WorkspaceChrome";
import { describeWhatsAppMessagingTier, describeWhatsAppQuality, fetchWhatsAppPhoneNumbers, humanizeWhatsAppEnum, type WhatsAppPhoneNumber, type WhatsAppQualityRating } from "@/lib/whatsapp/phoneNumbers";
import { resolveWhatsAppMetaConfig } from "@/lib/whatsapp/workspaceCredentials";
import { getWhatsAppWorkspaceAccess } from "../auth";

export const metadata: Metadata = { title: "WhatsApp Phone Numbers | Web Growth", robots: { index: false, follow: false } };
function getQualityClasses(rating: WhatsAppQualityRating) { if (rating === "GREEN") return "border-ledger-bright/20 bg-ledger-tint text-ledger-bright"; if (rating === "YELLOW") return "border-brass/20 bg-brass-tint text-brass"; if (rating === "RED") return "border-rose-900/40 bg-rose-950/30 text-rose-300"; return "border-rule bg-paper-sunk text-ink-faint"; }
function EmptyState({ title, children }: { title: string; children: React.ReactNode }) { return <div className="mx-auto max-w-xl px-6 py-14 text-center"><span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-rule bg-paper-sunk text-ink-faint"><WhatsAppIcon name="phoneNumbers" className="h-5 w-5" /></span><p className="mt-4 text-sm font-semibold text-ink">{title}</p><div className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-ink-faint">{children}</div></div>; }
function Row({ label, value }: { label: string; value: React.ReactNode }) { return <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-start gap-4 border-t border-rule py-2.5 text-xs first:border-t-0"><dt className="text-ink-faint">{label}</dt><dd className="min-w-0 break-words text-right text-ink">{value}</dd></div>; }
function PhoneNumberCard({ number, isConfiguredSender }: { number: WhatsAppPhoneNumber; isConfiguredSender: boolean }) {
  const verified = number.codeVerificationStatus?.toUpperCase() === "VERIFIED"; const live = number.accountMode?.toUpperCase() === "LIVE";
  return <article className={`border-b border-rule p-4 last:border-b-0 ${isConfiguredSender ? "bg-ledger-tint/30" : "hover:bg-white/[.018]"}`}><div className="flex flex-wrap items-start gap-3"><span className={`grid h-10 w-10 flex-none place-items-center rounded-lg border ${isConfiguredSender ? "border-ledger-bright/20 bg-ledger-tint text-ledger-bright" : "border-rule bg-paper-sunk text-ink-faint"}`}><WhatsAppIcon name="phoneNumbers" className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate font-mono text-sm font-semibold text-ink">{number.displayPhoneNumber || "Number not returned"}</h2>{isConfiguredSender ? <span className="rounded-full border border-ledger-bright/20 bg-ledger-tint px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[.08em] text-ledger-bright">Primary sender</span> : null}</div><p className="mt-1 truncate text-xs text-ink-faint">{number.verifiedName || "No verified name"}</p></div><span className={`rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold ${getQualityClasses(number.qualityRating)}`}>{describeWhatsAppQuality(number.qualityRating)} quality</span></div><dl className="mt-4 grid gap-x-6 rounded-lg border border-rule bg-paper px-3 md:grid-cols-2"><Row label="Messaging limit" value={describeWhatsAppMessagingTier(number.messagingLimitTier) || "—"}/><Row label="Verification" value={<span className={verified?"font-medium text-ledger-bright":"text-ink-faint"}>{humanizeWhatsAppEnum(number.codeVerificationStatus)||"—"}</span>}/><Row label="Account mode" value={<span className={live?"font-medium text-ledger-bright":"text-ink-faint"}>{humanizeWhatsAppEnum(number.accountMode)||"—"}</span>}/><Row label="Display-name status" value={humanizeWhatsAppEnum(number.nameStatus)||"—"}/><Row label="Platform" value={humanizeWhatsAppEnum(number.platformType)||"—"}/><Row label="Throughput" value={humanizeWhatsAppEnum(number.throughputLevel)||"—"}/><Row label="Official business account" value={number.isOfficialBusinessAccount===undefined?"—":number.isOfficialBusinessAccount?"Yes":"No"}/><Row label="Phone number ID" value={<span className="font-mono text-[0.68rem] text-ink-soft">{number.id}</span>}/></dl>{number.webhookUrl ? <p className="mt-2 break-all font-mono text-[0.65rem] text-ink-faint">Webhook: {number.webhookUrl}</p> : null}</article>;
}

export default async function WhatsAppPhoneNumbersPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || access.role !== "owner") return <div className="p-6"><div className="mx-auto max-w-xl rounded-xl border border-rose-900/40 bg-rose-950/30 px-5 py-6 text-sm text-rose-200">Workspace Owner access is required for phone-number diagnostics.</div></div>;
  const [result, configured] = await Promise.all([fetchWhatsAppPhoneNumbers({ workspaceId: access.workspaceId }), resolveWhatsAppMetaConfig({ workspaceId: access.workspaceId })]);

  return (
    <div className="flex min-h-full min-w-0 flex-col">
      <WorkspaceToolbar eyebrow="Meta connection" title="Phone numbers" description="Sender identity, verification, quality and messaging capacity." actions={<WorkspaceActionLink href="/admin/whatsapp/settings/#connection" icon="settings" primary>Connection settings</WorkspaceActionLink>} />
      <main className="min-w-0 bg-[#060a0e] p-3 sm:p-4">
        {!result.ok ? <WorkspaceSurface>{result.reason === "NOT_CONFIGURED" ? <EmptyState title="Phone numbers are not configured">Connect this workspace to its Meta WhatsApp Business Account from the platform workspace manager.</EmptyState> : result.reason === "PERMISSION_DENIED" ? <EmptyState title="Meta refused the request">The workspace access token was rejected or cannot read this WhatsApp Business Account.</EmptyState> : <EmptyState title="Could not reach Meta">The Graph API did not return the phone numbers. The server log has the provider detail.</EmptyState>}</WorkspaceSurface> : <PhoneNumbersContent phoneNumbers={result.phoneNumbers} configuredPhoneNumberId={configured?.phoneNumberId} />}
      </main>
    </div>
  );
}

function PhoneNumbersContent({ phoneNumbers, configuredPhoneNumberId }: { phoneNumbers: WhatsAppPhoneNumber[]; configuredPhoneNumberId?: string }) {
  const primary = phoneNumbers.find((number) => Boolean(configuredPhoneNumberId) && number.id === configuredPhoneNumberId);
  return <>
    <section className="mb-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <WorkspaceStat label="Connected" value={phoneNumbers.length} note="Meta senders" icon="phoneNumbers" />
      <WorkspaceStat label="Primary" value={primary?.displayPhoneNumber || "—"} note="Configured sender" icon="statusDelivered" tone={primary ? "good" : "warn"} />
      <WorkspaceStat label="Quality" value={primary ? describeWhatsAppQuality(primary.qualityRating) : "—"} note="Primary sender" icon="analytics" />
      <WorkspaceStat label="Messaging tier" value={primary ? describeWhatsAppMessagingTier(primary.messagingLimitTier) || "—" : "—"} note="Meta limit" icon="overview" />
    </section>
    <WorkspaceSurface>{phoneNumbers.length===0?<EmptyState title="No phone numbers on this account">Numbers added to this workspace&apos;s WhatsApp Business Account will appear here.</EmptyState>:<div>{phoneNumbers.map((number)=><PhoneNumberCard key={number.id} number={number} isConfiguredSender={Boolean(configuredPhoneNumberId)&&number.id===configuredPhoneNumberId}/>)}</div>}</WorkspaceSurface>
    <p className="mt-3 rounded-lg border border-rule bg-paper-raised px-3 py-2.5 text-[0.68rem] leading-5 text-ink-faint">Meta controls quality ratings and messaging limits. Operational configuration remains under Settings.</p>
  </>;
}
