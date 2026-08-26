import { applyWhatsAppLeadKeywords, type WhatsAppLeadKeywordRules } from "./settings";
import type { WhatsAppClassification, WhatsAppIntent } from "./types";

const SERVICE_WINDOW_SECONDS = 24 * 60 * 60;

function hot(intent: WhatsAppIntent): WhatsAppClassification {
  return {
    intent,
    temperature: "HOT",
    humanReviewRequired: true,
    safeReplyKind: "ACKNOWLEDGEMENT",
  };
}

/**
 * The built-in rules. These are the floor: operator keywords layer on top of the
 * result rather than replacing it, so intent detection cannot be switched off.
 * `text` is already trimmed and lowercased.
 */
function classifyBuiltInIntent(text: string): WhatsAppClassification {
  if (!text) {
    return {
      intent: "OTHER",
      temperature: "COLD",
      humanReviewRequired: false,
      safeReplyKind: "NONE",
    };
  }

  if (/proposal|quotation|quote\b/.test(text)) return hot("PROPOSAL_REQUEST");
  if (/price|pricing|cost|budget|discount|payment plan|refund/.test(text)) {
    return hot("PRICING_REQUEST");
  }
  if (/meeting|book (?:a |the )?call|schedule (?:a |the )?call|call tomorrow/.test(text)) {
    return hot("MEETING_REQUEST");
  }
  if (/deadline|start date|start next|next week|delivery date|how soon/.test(text)) {
    return hot("DEADLINE_REQUEST");
  }
  if (/scope|requirements|need (?:a |an )?(?:website|store|landing page)|build (?:a |an )?/.test(text)) {
    return hot("PROJECT_SCOPE");
  }
  if (/portfolio|previous work|case stud/.test(text)) {
    return { intent: "PORTFOLIO_REQUEST", temperature: "WARM", humanReviewRequired: false, safeReplyKind: "PORTFOLIO" };
  }
  if (/audit|review my (?:site|website)|check my (?:site|website)/.test(text)) {
    return { intent: "WEBSITE_AUDIT_REQUEST", temperature: "WARM", humanReviewRequired: false, safeReplyKind: "AUDIT" };
  }
  if (/support|broken|issue|problem with/.test(text)) {
    return { intent: "SUPPORT_REQUEST", temperature: "WARM", humanReviewRequired: true, safeReplyKind: "ACKNOWLEDGEMENT" };
  }
  if (/seo|website redesign|web design|wordpress|shopify|webflow|core web vitals|analytics|ga4|pixel|crm|email marketing|hosting|domain|dns|ssl|booking/.test(text)) {
    return { intent: "SERVICE_QUESTION", temperature: "WARM", humanReviewRequired: false, safeReplyKind: "SERVICE" };
  }
  if (/hello|hi\b|help|website/.test(text)) {
    return { intent: "NEW_LEAD", temperature: "WARM", humanReviewRequired: false, safeReplyKind: "NEW_LEAD" };
  }
  return { intent: "OTHER", temperature: "COLD", humanReviewRequired: false, safeReplyKind: "NONE" };
}

/**
 * Classifies an inbound message, optionally applying the operator's keyword rules
 * from the Settings page.
 *
 * `rules` is optional so every existing caller and test keeps its behaviour
 * exactly. When it is absent the result is the built-in classification and
 * nothing else.
 */
export function classifyWhatsAppIntent(
  input: string,
  rules?: WhatsAppLeadKeywordRules,
): WhatsAppClassification {
  const text = input.trim().toLowerCase();
  const base = classifyBuiltInIntent(text);
  if (!rules) return base;

  const applied = applyWhatsAppLeadKeywords(base, text, rules);
  return {
    intent: applied.intent,
    temperature: applied.temperature,
    humanReviewRequired: applied.humanReviewRequired,
    safeReplyKind: applied.safeReplyKind,
  };
}

export function isFreeformReplyAllowed(messageTimestamp: number, now = Date.now() / 1000) {
  return now >= messageTimestamp && now - messageTimestamp <= SERVICE_WINDOW_SECONDS;
}
