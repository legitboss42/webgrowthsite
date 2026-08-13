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

export function filterWhatsAppLeads(leads: WhatsAppLeadRow[], filter: WhatsAppLeadFilter) {
  if (filter === "HOT") return leads.filter((lead) => lead.lead_temperature === "HOT");
  if (filter === "WARM") return leads.filter((lead) => lead.lead_temperature === "WARM");
  if (filter === "REVIEW") return leads.filter((lead) => lead.human_review_required);
  if (filter === "PRICING") return leads.filter((lead) => lead.intent === "PRICING_REQUEST");
  if (filter === "MEETING") return leads.filter((lead) => lead.intent === "MEETING_REQUEST");
  if (filter === "PROPOSAL") return leads.filter((lead) => lead.intent === "PROPOSAL_REQUEST");
  return leads;
}
