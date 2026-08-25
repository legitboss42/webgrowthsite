/**
 * Shared contract for the /automation early-access waitlist.
 *
 * Imported by both the browser form and the server route so the allowed values,
 * field limits and validation rules cannot drift apart. Deliberately free of
 * server-only imports and of any TikTok or WhatsApp product code.
 */

export const WAITLIST_SOURCE = "automation_waitlist_landing_page";

/**
 * Shown wherever an optional field was left blank. Keeping it in one place means
 * the admin table and the label helpers can never disagree. A plain hyphen, not
 * an en dash: the site deliberately uses only ASCII dashes.
 */
export const NO_VALUE = "-";

export const WAITLIST_INTERESTS = [
  { value: "whatsapp", label: "WhatsApp Automation" },
  { value: "tiktok", label: "TikTok Scheduler" },
  { value: "both", label: "Both" },
] as const;

export const WAITLIST_BUSINESS_SIZES = [
  { value: "solo", label: "Solo" },
  { value: "2-5", label: "2 to 5 people" },
  { value: "6-20", label: "6 to 20 people" },
  { value: "21-50", label: "21 to 50 people" },
  { value: "50+", label: "50+ people" },
] as const;

export type WaitlistInterest = (typeof WAITLIST_INTERESTS)[number]["value"];
export type WaitlistBusinessSize = (typeof WAITLIST_BUSINESS_SIZES)[number]["value"];

const INTEREST_VALUES = WAITLIST_INTERESTS.map((option) => option.value) as readonly string[];
const BUSINESS_SIZE_VALUES = WAITLIST_BUSINESS_SIZES.map(
  (option) => option.value
) as readonly string[];

export const WAITLIST_LIMITS = {
  fullNameMin: 2,
  fullNameMax: 120,
  emailMax: 254,
  businessNameMax: 160,
  useCaseMax: 1000,
} as const;

/** Human-readable interest label, used in the confirmation email and admin table. */
export function getInterestLabel(interest: string): string {
  const match = WAITLIST_INTERESTS.find((option) => option.value === interest);
  return match ? match.label : "Web Growth Automation";
}

/** The email copy lists both products when someone selects "both". */
export function getInterestEmailLabel(interest: string): string {
  if (interest === "both") return "WhatsApp Automation + TikTok Scheduler";
  return getInterestLabel(interest);
}

export function getBusinessSizeLabel(businessSize: string | null | undefined): string {
  if (!businessSize) return NO_VALUE;
  const match = WAITLIST_BUSINESS_SIZES.find((option) => option.value === businessSize);
  return match ? match.label : businessSize;
}

/**
 * First name for the email greeting. Falls back to "there" so the greeting never
 * renders as "Hi ,".
 */
export function getFirstName(fullName: string | null | undefined): string {
  const first = (fullName || "").trim().split(/\s+/)[0] || "";
  return first || "there";
}

export type WaitlistFieldErrors = Partial<
  Record<"fullName" | "email" | "businessName" | "interest" | "useCase" | "businessSize", string>
>;

export type WaitlistSubmission = {
  fullName: string;
  email: string;
  businessName: string | null;
  interest: WaitlistInterest;
  useCase: string | null;
  businessSize: WaitlistBusinessSize | null;
};

export type WaitlistValidationResult =
  | { ok: true; value: WaitlistSubmission }
  | { ok: false; errors: WaitlistFieldErrors };

function toText(value: unknown, maxLength: number): string {
  if (value === null || value === undefined) return "";
  return String(value).trim().slice(0, maxLength);
}

/** Mirrors the pattern used by src/lib/security.ts so behaviour stays consistent. */
function isValidEmailShape(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/**
 * Single source of truth for waitlist validation. Runs unchanged on the client
 * (for inline feedback) and on the server (as the authority; the client result
 * is never trusted).
 */
export function validateWaitlistSubmission(input: unknown): WaitlistValidationResult {
  const raw = (input ?? {}) as Record<string, unknown>;
  const errors: WaitlistFieldErrors = {};

  const fullName = toText(raw.fullName, WAITLIST_LIMITS.fullNameMax);
  const email = toText(raw.email, WAITLIST_LIMITS.emailMax).toLowerCase();
  const businessName = toText(raw.businessName, WAITLIST_LIMITS.businessNameMax);
  const useCase = toText(raw.useCase, WAITLIST_LIMITS.useCaseMax);
  const interest = toText(raw.interest, 20);
  const businessSize = toText(raw.businessSize, 20);

  if (!fullName) {
    errors.fullName = "Please enter your name.";
  } else if (fullName.length < WAITLIST_LIMITS.fullNameMin) {
    errors.fullName = "Please enter at least 2 characters.";
  }

  if (!email) {
    errors.email = "Please enter your email address.";
  } else if (!isValidEmailShape(email)) {
    errors.email = "Please enter a valid email address.";
  }

  if (!interest) {
    errors.interest = "Please choose what you're interested in.";
  } else if (!INTEREST_VALUES.includes(interest)) {
    errors.interest = "Please choose one of the listed options.";
  }

  if (businessSize && !BUSINESS_SIZE_VALUES.includes(businessSize)) {
    errors.businessSize = "Please choose one of the listed options.";
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    value: {
      fullName,
      email,
      businessName: businessName || null,
      interest: interest as WaitlistInterest,
      useCase: useCase || null,
      businessSize: (businessSize || null) as WaitlistBusinessSize | null,
    },
  };
}
