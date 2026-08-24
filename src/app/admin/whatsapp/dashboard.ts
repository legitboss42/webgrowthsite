import { isFreeformReplyAllowed } from "@/lib/whatsapp/classify";

export type WhatsAppLeadRow = {
  id: string;
  display_name?: string;
  wa_id: string;
  website?: string;
  source?: string;
  lead_temperature: "COLD" | "WARM" | "HOT";
  intent?: string;
  human_review_required: boolean;
  last_message_at?: string;
  status: string;
};

export type WhatsAppLeadFilter = "ALL" | "HOT" | "WARM" | "REVIEW" | "PRICING" | "MEETING" | "PROPOSAL";
export type WhatsAppLeadMessage = {
  id: string;
  whatsapp_message_id?: string;
  conversation_id: string;
  direction: "inbound" | "outbound";
  message_text?: string;
  message_timestamp?: string;
  delivery_status?: string;
};

export type WhatsAppDashboardModel = {
  filterCounts: Record<WhatsAppLeadFilter, number>;
  filteredLeads: WhatsAppLeadRow[];
  selectedLead: WhatsAppLeadRow | null;
  selectedMessages: WhatsAppLeadMessage[];
};

export type WhatsAppReplyComposerState = {
  enabled: boolean;
  reason?: "NOT_CONFIGURED" | "NO_CUSTOMER_MESSAGE" | "SERVICE_WINDOW_CLOSED";
  helperText: string;
  customerMessageTimestamp?: number;
  replyToMessageId?: string;
};

export function filterWhatsAppLeads(leads: WhatsAppLeadRow[], filter: WhatsAppLeadFilter) {
  if (filter === "HOT") return leads.filter((lead) => lead.lead_temperature === "HOT");
  if (filter === "WARM") return leads.filter((lead) => lead.lead_temperature === "WARM");
  if (filter === "REVIEW") return leads.filter((lead) => lead.human_review_required);
  if (filter === "PRICING") return leads.filter((lead) => lead.intent === "PRICING_REQUEST");
  if (filter === "MEETING") return leads.filter((lead) => lead.intent === "MEETING_REQUEST");
  if (filter === "PROPOSAL") return leads.filter((lead) => lead.intent === "PROPOSAL_REQUEST");
  return leads;
}

export function buildWhatsAppDashboardModel(input: {
  leads: WhatsAppLeadRow[];
  messages: WhatsAppLeadMessage[];
  filter: WhatsAppLeadFilter;
  selectedLeadId?: string;
}): WhatsAppDashboardModel {
  const filterCounts = {
    ALL: filterWhatsAppLeads(input.leads, "ALL").length,
    HOT: filterWhatsAppLeads(input.leads, "HOT").length,
    WARM: filterWhatsAppLeads(input.leads, "WARM").length,
    REVIEW: filterWhatsAppLeads(input.leads, "REVIEW").length,
    PRICING: filterWhatsAppLeads(input.leads, "PRICING").length,
    MEETING: filterWhatsAppLeads(input.leads, "MEETING").length,
    PROPOSAL: filterWhatsAppLeads(input.leads, "PROPOSAL").length,
  } satisfies Record<WhatsAppLeadFilter, number>;

  const filteredLeads = filterWhatsAppLeads(input.leads, input.filter);
  const selectedLead =
    filteredLeads.find((lead) => lead.id === input.selectedLeadId) ||
    filteredLeads[0] ||
    null;

  const selectedMessages = selectedLead
    ? input.messages
        .filter((message) => message.conversation_id === selectedLead.id)
        .sort((left, right) => {
          const leftTime = left.message_timestamp ? Date.parse(left.message_timestamp) : 0;
          const rightTime = right.message_timestamp ? Date.parse(right.message_timestamp) : 0;
          return leftTime - rightTime;
        })
    : [];

  return {
    filterCounts,
    filteredLeads,
    selectedLead,
    selectedMessages,
  };
}

export function buildWhatsAppReplyComposerState(input: {
  selectedLead: WhatsAppLeadRow | null;
  selectedMessages: WhatsAppLeadMessage[];
  senderConfigured: boolean;
  now?: number;
}): WhatsAppReplyComposerState {
  if (!input.selectedLead) {
    return {
      enabled: false,
      reason: "NO_CUSTOMER_MESSAGE",
      helperText: "Select a conversation before sending a reply.",
    };
  }

  if (!input.senderConfigured) {
    return {
      enabled: false,
      reason: "NOT_CONFIGURED",
      helperText: "Official Meta sender credentials are not configured yet, so replies stay disabled here.",
    };
  }

  const latestInbound = [...input.selectedMessages]
    .filter((message) => message.direction === "inbound" && message.message_timestamp)
    .sort((left, right) => {
      const leftTime = left.message_timestamp ? Date.parse(left.message_timestamp) : 0;
      const rightTime = right.message_timestamp ? Date.parse(right.message_timestamp) : 0;
      return rightTime - leftTime;
    })[0];

  if (!latestInbound?.message_timestamp) {
    return {
      enabled: false,
      reason: "NO_CUSTOMER_MESSAGE",
      helperText: "This conversation needs an inbound customer message before a free-form reply can be sent.",
    };
  }

  const customerMessageTimestamp = Math.floor(Date.parse(latestInbound.message_timestamp) / 1000);
  if (!isFreeformReplyAllowed(customerMessageTimestamp, input.now)) {
    return {
      enabled: false,
      reason: "SERVICE_WINDOW_CLOSED",
      customerMessageTimestamp,
      replyToMessageId: latestInbound.whatsapp_message_id,
      helperText: "The 24-hour customer service window has closed, so this inbox will not send a free-form reply.",
    };
  }

  return {
    enabled: true,
    customerMessageTimestamp,
    replyToMessageId: latestInbound.whatsapp_message_id,
    helperText: input.selectedLead.human_review_required
      ? "Human review is still flagged for this lead. You can reply manually here, but avoid pricing, scope, and delivery commitments."
      : "Replying here sends an official WhatsApp Cloud API message and stores it in the CRM thread.",
  };
}
