import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getWhatsAppWorkspaceAccess } from "@/app/admin/whatsapp/auth";
import { readWhatsAppRows } from "@/app/admin/whatsapp/data";
import {
  buildWhatsAppAnalyticsTrend,
  classifyWhatsAppAnalyticsPeriod,
  countWhatsAppAnalyticsStatuses,
  safeWhatsAppAnalyticsRate,
  summarizeWhatsAppDurations,
  topWhatsAppAnalyticsEntries,
} from "@/app/admin/whatsapp/advancedAnalyticsModel";
import {
  buildWhatsAppResponseTimes,
  resolveWhatsAppAnalyticsRange,
  type WhatsAppAnalyticsMessage,
} from "@/app/admin/whatsapp/analyticsModel";

export const runtime = "nodejs";

const ROW_LIMIT = 20000;
const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_STATUSES = ["QUEUED", "RUNNING", "WAITING", "SUCCEEDED", "FAILED", "SKIPPED", "CANCELLED"] as const;

type GenericRow = Record<string, unknown>;
type Period = "current" | "previous";

function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function number(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : Number(value) || 0; }
function object(value: unknown): Record<string, unknown> { return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {}; }
function strings(value: unknown) { return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []; }
function timestamp(row: GenericRow, key: string) { return text(row[key]); }

function periodRows(rows: GenericRow[], key: string, period: Period, currentStartMs: number, previousStartMs: number, nowMs: number) {
  return rows.filter((row) => classifyWhatsAppAnalyticsPeriod(timestamp(row, key), currentStartMs, previousStartMs, nowMs) === period);
}

function countsBy(rows: GenericRow[], key: string) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const value = text(row[key]) || "Unknown";
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

function isAnsweredCall(row: GenericRow) {
  const status = text(row.status).toLowerCase();
  return Boolean(text(row.answered_at)) || ["accepted", "connected", "completed"].includes(status);
}
function isMissedInboundCall(row: GenericRow) {
  if (text(row.direction) !== "inbound" || isAnsweredCall(row)) return false;
  const status = text(row.status).toLowerCase();
  return Boolean(text(row.ended_at)) || ["missed", "rejected", "failed", "terminate", "terminated"].includes(status);
}
function callSummary(rows: GenericRow[]) {
  let inbound = 0; let outbound = 0; let answeredInbound = 0; let answered = 0; let missed = 0; let totalTalkSeconds = 0; let durationSamples = 0;
  for (const row of rows) {
    const direction = text(row.direction) === "outbound" ? "outbound" : "inbound";
    if (direction === "outbound") outbound += 1; else inbound += 1;
    if (isAnsweredCall(row)) { answered += 1; if (direction === "inbound") answeredInbound += 1; }
    if (isMissedInboundCall(row)) missed += 1;
    const duration = Math.max(0, number(row.duration_seconds));
    if (duration > 0) { totalTalkSeconds += duration; durationSamples += 1; }
  }
  return {
    total: rows.length, inbound, outbound, answered, missed,
    answerRate: safeWhatsAppAnalyticsRate(answeredInbound, inbound),
    averageDurationSeconds: durationSamples ? totalTalkSeconds / durationSamples : null,
    totalTalkSeconds,
  };
}

function flowSummary(rows: GenericRow[]) {
  const completed = rows.filter((row) => text(row.status).toUpperCase() === "COMPLETED").length;
  const failed = rows.filter((row) => text(row.status).toUpperCase() === "FAILED").length;
  const started = rows.filter((row) => text(row.status).toUpperCase() === "STARTED").length;
  const durations = summarizeWhatsAppDurations(rows.map((row) => {
    const start = Date.parse(text(row.started_at)); const end = Date.parse(text(row.completed_at));
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
  }));
  return { launches: rows.length, completed, failed, incomplete: started, completionRate: safeWhatsAppAnalyticsRate(completed, rows.length), duration: durations };
}

function campaignRecipientSummary(rows: GenericRow[]) {
  const status = (wanted: string) => rows.filter((row) => text(row.status).toUpperCase() === wanted).length;
  const sentOrBeyond = rows.filter((row) => ["SENT", "DELIVERED", "READ", "REPLIED"].includes(text(row.status).toUpperCase())).length;
  const deliveredOrBeyond = rows.filter((row) => ["DELIVERED", "READ", "REPLIED"].includes(text(row.status).toUpperCase())).length;
  const readOrBeyond = rows.filter((row) => ["READ", "REPLIED"].includes(text(row.status).toUpperCase())).length;
  const replied = status("REPLIED");
  return {
    recipients: rows.length,
    sent: sentOrBeyond,
    delivered: deliveredOrBeyond,
    read: readOrBeyond,
    replied,
    failed: status("FAILED"),
    skipped: status("SKIPPED"),
    deliveryRate: safeWhatsAppAnalyticsRate(deliveredOrBeyond, sentOrBeyond),
    readRate: safeWhatsAppAnalyticsRate(readOrBeyond, sentOrBeyond),
    replyRate: safeWhatsAppAnalyticsRate(replied, sentOrBeyond),
    failureRate: safeWhatsAppAnalyticsRate(status("FAILED"), rows.length),
  };
}

export async function GET(request: Request) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  if (access.role !== "owner") return NextResponse.json({ error: "Owner access is required for advanced analytics." }, { status: 403 });

  const url = new URL(request.url);
  const range = resolveWhatsAppAnalyticsRange(url.searchParams.get("days") || undefined);
  const nowMs = Date.now();
  const currentStartMs = nowMs - range * DAY_MS;
  const previousStartMs = currentStartMs - range * DAY_MS;
  const previousStartIso = new Date(previousStartMs).toISOString();

  const [messages, conversations, contacts, members, activity, automations, runs, campaigns, recipients, flows, submissions, calls] = await Promise.all([
    readWhatsAppRows<GenericRow>(`whatsapp_messages?select=direction,message_timestamp,delivery_status,conversation_id&message_timestamp=gte.${encodeURIComponent(previousStartIso)}&order=message_timestamp.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_conversations?select=id,status,created_at,updated_at,assigned_member_id,last_message_at&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_contacts?select=id,lead_stage,lead_temperature,opt_in_status,source,tags,created_at&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_team_members?select=id,display_name,google_email,role,active,last_seen_at&limit=500`),
    readWhatsAppRows<GenericRow>(`whatsapp_team_activity?select=event_type,actor_member_id,actor_email,target_member_id,metadata,created_at&created_at=gte.${encodeURIComponent(previousStartIso)}&order=created_at.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_automations?select=id,name,status,trigger_type&limit=1000`),
    readWhatsAppRows<GenericRow>(`whatsapp_automation_runs?select=id,automation_id,status,trigger_type,started_at,completed_at,error_code,error_message,created_at,conversation_id&created_at=gte.${encodeURIComponent(previousStartIso)}&order=created_at.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_campaigns?select=id,name,status,template_name,audience_count,eligible_count,sent_count,delivered_count,read_count,replied_count,failed_count,skipped_count,created_at,started_at,completed_at&created_at=gte.${encodeURIComponent(previousStartIso)}&order=created_at.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_campaign_recipients?select=id,campaign_id,status,error_code,error_message,created_at,sent_at,delivered_at,read_at,replied_at&created_at=gte.${encodeURIComponent(previousStartIso)}&order=created_at.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_flows?select=id,name,status,meta_flow_id&limit=1000`),
    readWhatsAppRows<GenericRow>(`whatsapp_flow_submissions?select=id,flow_id,status,started_at,completed_at,created_at,error_message,conversation_id,contact_id&created_at=gte.${encodeURIComponent(previousStartIso)}&order=created_at.desc&limit=${ROW_LIMIT}`),
    readWhatsAppRows<GenericRow>(`whatsapp_calls?select=direction,status,started_at,answered_at,ended_at,duration_seconds&started_at=gte.${encodeURIComponent(previousStartIso)}&order=started_at.desc&limit=${ROW_LIMIT}`),
  ]);

  const reads = [messages, conversations, contacts, members, activity, automations, runs, campaigns, recipients, flows, submissions, calls];
  if (reads.some((value) => value === null)) {
    return NextResponse.json({ error: "Advanced analytics could not read all required WhatsApp data." }, { status: 503 });
  }

  const messageRows = messages!; const conversationRows = conversations!; const contactRows = contacts!; const memberRows = members!; const activityRows = activity!;
  const automationRows = automations!; const runRows = runs!; const campaignRows = campaigns!; const recipientRows = recipients!; const flowRows = flows!; const submissionRows = submissions!; const callRows = calls!;
  const currentMessages = periodRows(messageRows, "message_timestamp", "current", currentStartMs, previousStartMs, nowMs);
  const previousMessages = periodRows(messageRows, "message_timestamp", "previous", currentStartMs, previousStartMs, nowMs);
  const currentActivity = periodRows(activityRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousActivity = periodRows(activityRows, "created_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentRuns = periodRows(runRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousRuns = periodRows(runRows, "created_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentRecipients = periodRows(recipientRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousRecipients = periodRows(recipientRows, "created_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentSubmissions = periodRows(submissionRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousSubmissions = periodRows(submissionRows, "created_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentCalls = periodRows(callRows, "started_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousCalls = periodRows(callRows, "started_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentContacts = periodRows(contactRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);
  const previousContacts = periodRows(contactRows, "created_at", "previous", currentStartMs, previousStartMs, nowMs);
  const currentCampaigns = periodRows(campaignRows, "created_at", "current", currentStartMs, previousStartMs, nowMs);

  const asMessages = (rows: GenericRow[]): WhatsAppAnalyticsMessage[] => rows.map((row) => ({
    direction: text(row.direction) === "outbound" ? "outbound" : "inbound",
    message_timestamp: text(row.message_timestamp) || undefined,
    delivery_status: text(row.delivery_status) || null,
    conversation_id: text(row.conversation_id) || undefined,
  }));
  const currentResponse = buildWhatsAppResponseTimes(asMessages(currentMessages));
  const previousResponse = buildWhatsAppResponseTimes(asMessages(previousMessages));

  const currentOpened = currentActivity.filter((row) => text(row.event_type) === "conversation_opened").length;
  const previousOpened = previousActivity.filter((row) => text(row.event_type) === "conversation_opened").length;
  const currentClosed = currentActivity.filter((row) => text(row.event_type) === "conversation_closed").length;
  const previousClosed = previousActivity.filter((row) => text(row.event_type) === "conversation_closed").length;
  const openBacklog = conversationRows.filter((row) => text(row.status).toLowerCase() === "open").length;
  const currentInbound = currentMessages.filter((row) => text(row.direction) !== "outbound").length;
  const currentOutbound = currentMessages.filter((row) => text(row.direction) === "outbound").length;
  const hourCounts = Array.from({ length: 24 }, (_, hour) => ({ hour, count: 0 }));
  for (const row of currentMessages) {
    const at = Date.parse(text(row.message_timestamp));
    if (Number.isFinite(at)) hourCounts[new Date(at).getUTCHours()].count += 1;
  }
  const busiestHour = [...hourCounts].sort((a, b) => b.count - a.count)[0];

  const runStatusCurrent = countWhatsAppAnalyticsStatuses(currentRuns.map((row) => text(row.status)), RUN_STATUSES);
  const runStatusPrevious = countWhatsAppAnalyticsStatuses(previousRuns.map((row) => text(row.status)), RUN_STATUSES);
  const currentFinishedRuns = runStatusCurrent.SUCCEEDED + runStatusCurrent.FAILED;
  const previousFinishedRuns = runStatusPrevious.SUCCEEDED + runStatusPrevious.FAILED;
  const currentAutomationSuccessRate = safeWhatsAppAnalyticsRate(runStatusCurrent.SUCCEEDED, currentFinishedRuns);
  const previousAutomationSuccessRate = safeWhatsAppAnalyticsRate(runStatusPrevious.SUCCEEDED, previousFinishedRuns);
  const runDurations = summarizeWhatsAppDurations(currentRuns.map((row) => {
    const start = Date.parse(text(row.started_at)); const end = Date.parse(text(row.completed_at));
    return Number.isFinite(start) && Number.isFinite(end) && end >= start ? end - start : null;
  }));
  const automationName = new Map(automationRows.map((row) => [text(row.id), text(row.name) || "Unnamed automation"]));
  const workflowStats = new Map<string, { id: string; name: string; runs: number; succeeded: number; failed: number; waiting: number; cancelled: number }>();
  for (const row of currentRuns) {
    const id = text(row.automation_id); const existing = workflowStats.get(id) || { id, name: automationName.get(id) || "Unknown automation", runs: 0, succeeded: 0, failed: 0, waiting: 0, cancelled: 0 };
    existing.runs += 1;
    const status = text(row.status).toUpperCase();
    if (status === "SUCCEEDED") existing.succeeded += 1;
    if (status === "FAILED") existing.failed += 1;
    if (status === "WAITING") existing.waiting += 1;
    if (status === "CANCELLED") existing.cancelled += 1;
    workflowStats.set(id, existing);
  }
  const workflowRows = [...workflowStats.values()].sort((a, b) => b.runs - a.runs || b.failed - a.failed);
  const recentFailures = currentRuns.filter((row) => text(row.status).toUpperCase() === "FAILED").slice(0, 12).map((row) => ({
    id: text(row.id), automationId: text(row.automation_id), automationName: automationName.get(text(row.automation_id)) || "Unknown automation",
    trigger: text(row.trigger_type), errorCode: text(row.error_code) || null, error: text(row.error_message) || "Run failed without a stored error message.", createdAt: text(row.created_at),
  }));

  const currentFlow = flowSummary(currentSubmissions); const previousFlow = flowSummary(previousSubmissions);
  const flowName = new Map(flowRows.map((row) => [text(row.id), text(row.name) || "Unnamed Flow"]));
  const flowPerformance = flowRows.map((flow) => {
    const id = text(flow.id); const rows = currentSubmissions.filter((row) => text(row.flow_id) === id); const summary = flowSummary(rows);
    return { id, name: text(flow.name), status: text(flow.status), ...summary };
  }).filter((row) => row.launches > 0 || text(flowRows.find((flow) => text(flow.id) === row.id)?.status) === "PUBLISHED").sort((a, b) => b.launches - a.launches);

  const currentCampaign = campaignRecipientSummary(currentRecipients); const previousCampaign = campaignRecipientSummary(previousRecipients);
  const campaignPerformance = currentCampaigns.map((campaign) => ({
    id: text(campaign.id), name: text(campaign.name), status: text(campaign.status), template: text(campaign.template_name) || null,
    audience: number(campaign.audience_count), eligible: number(campaign.eligible_count), sent: number(campaign.sent_count), delivered: number(campaign.delivered_count), read: number(campaign.read_count), replied: number(campaign.replied_count), failed: number(campaign.failed_count), skipped: number(campaign.skipped_count),
  }));
  const recipientFailures = currentRecipients.filter((row) => text(row.status).toUpperCase() === "FAILED").slice(0, 12).map((row) => ({ campaignId: text(row.campaign_id), errorCode: text(row.error_code) || null, error: text(row.error_message) || "Recipient send failed." }));

  const currentCall = callSummary(currentCalls); const previousCall = callSummary(previousCalls);

  const stages = countsBy(contactRows, "lead_stage");
  const temperatures = countsBy(contactRows, "lead_temperature");
  const consent = countsBy(contactRows, "opt_in_status");
  const sources = topWhatsAppAnalyticsEntries(contactRows.map((row) => text(row.source) || null));
  const tags = topWhatsAppAnalyticsEntries(contactRows.flatMap((row) => strings(row.tags)));

  const memberMetrics = memberRows.map((member) => {
    const id = text(member.id); const email = text(member.google_email);
    const assigned = conversationRows.filter((row) => text(row.assigned_member_id) === id).length;
    const replies = currentActivity.filter((row) => text(row.event_type) === "conversation_reply_sent" && (text(row.actor_member_id) === id || (!text(row.actor_member_id) && text(row.actor_email) === email))).length;
    const closed = currentActivity.filter((row) => text(row.event_type) === "conversation_closed" && (text(row.actor_member_id) === id || (!text(row.actor_member_id) && text(row.actor_email) === email))).length;
    const assignments = currentActivity.filter((row) => ["conversation_assigned", "conversation_reassigned"].includes(text(row.event_type)) && text(row.target_member_id) === id).length;
    return { id, name: text(member.display_name) || email || "Team member", email, role: text(member.role), active: member.active !== false, assigned, replies, closed, assignments, lastSeenAt: text(member.last_seen_at) || null };
  }).sort((a, b) => b.assigned - a.assigned || b.replies - a.replies);

  const previousNewContacts = previousContacts.length;
  const overview = {
    openBacklog,
    newContacts: currentContacts.length,
    conversationsOpened: currentOpened,
    medianFirstResponseMs: currentResponse.medianMs,
    automationSuccessRate: currentAutomationSuccessRate,
    campaignReplyRate: currentCampaign.replyRate,
    flowCompletionRate: currentFlow.completionRate,
    callAnswerRate: currentCall.answerRate,
    trends: {
      newContacts: buildWhatsAppAnalyticsTrend(currentContacts.length, previousNewContacts),
      conversationsOpened: buildWhatsAppAnalyticsTrend(currentOpened, previousOpened),
      medianFirstResponseMs: buildWhatsAppAnalyticsTrend(currentResponse.medianMs, previousResponse.medianMs, { lowerIsBetter: true }),
      automationSuccessRate: buildWhatsAppAnalyticsTrend(currentAutomationSuccessRate, previousAutomationSuccessRate),
      campaignReplyRate: buildWhatsAppAnalyticsTrend(currentCampaign.replyRate, previousCampaign.replyRate),
      flowCompletionRate: buildWhatsAppAnalyticsTrend(currentFlow.completionRate, previousFlow.completionRate),
      callAnswerRate: buildWhatsAppAnalyticsTrend(currentCall.answerRate, previousCall.answerRate),
    },
  };

  return NextResponse.json({
    ok: true,
    generatedAt: new Date(nowMs).toISOString(),
    range,
    period: { currentStart: new Date(currentStartMs).toISOString(), previousStart: new Date(previousStartMs).toISOString(), end: new Date(nowMs).toISOString() },
    capped: { messages: messageRows.length >= ROW_LIMIT, activity: activityRows.length >= ROW_LIMIT, automationRuns: runRows.length >= ROW_LIMIT, campaignRecipients: recipientRows.length >= ROW_LIMIT, flowSubmissions: submissionRows.length >= ROW_LIMIT, calls: callRows.length >= ROW_LIMIT },
    overview,
    conversations: {
      opened: currentOpened, closed: currentClosed, previousOpened, previousClosed, openBacklog,
      inboundMessages: currentInbound, outboundMessages: currentOutbound,
      response: currentResponse,
      busiestHourUtc: busiestHour?.count ? busiestHour : null,
    },
    team: { members: memberMetrics },
    crm: { newContacts: currentContacts.length, stages, temperatures, consent, sources, tags, note: "Pipeline distributions are current-state snapshots; they are not presented as historical conversion rates." },
    automations: {
      totalRuns: currentRuns.length, statuses: runStatusCurrent, successRate: currentAutomationSuccessRate,
      failureRate: safeWhatsAppAnalyticsRate(runStatusCurrent.FAILED, currentFinishedRuns), duration: runDurations,
      byWorkflow: workflowRows, byTrigger: countsBy(currentRuns, "trigger_type"), recentFailures,
    },
    campaigns: { ...currentCampaign, campaigns: campaignPerformance, recipientFailures },
    flows: { ...currentFlow, byFlow: flowPerformance, recent: currentSubmissions.slice(0, 12).map((row) => ({ id: text(row.id), flowId: text(row.flow_id), flowName: flowName.get(text(row.flow_id)) || "Unknown Flow", status: text(row.status), startedAt: text(row.started_at) || text(row.created_at), completedAt: text(row.completed_at) || null, error: text(row.error_message) || null })) },
    calls: currentCall,
  });
}
