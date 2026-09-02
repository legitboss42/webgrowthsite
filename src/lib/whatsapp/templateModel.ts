export type WhatsAppTemplateCategory = "MARKETING" | "UTILITY";
export type WhatsAppTemplateButtonType = "QUICK_REPLY" | "URL" | "PHONE_NUMBER";

export type WhatsAppTemplateDraftButton = {
  type: WhatsAppTemplateButtonType;
  text: string;
  value?: string;
};

export type WhatsAppTemplateDraftInput = {
  name: string;
  language: string;
  category: WhatsAppTemplateCategory;
  headerText: string;
  bodyText: string;
  footerText: string;
  buttons: WhatsAppTemplateDraftButton[];
  /** Scoped keys such as `header:1` and `body:1`. */
  variableExamples: Record<string, string>;
};

export type WhatsAppTemplateDraft = WhatsAppTemplateDraftInput & {
  id: string;
  metaTemplateId?: string;
  submittedAt?: string;
  createdByMemberId?: string;
  updatedByMemberId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppTemplateVariableField = {
  key: string;
  component: "HEADER" | "BODY";
  token: string;
};

export const WHATSAPP_TEMPLATE_LIMITS = {
  name: 512,
  header: 60,
  body: 1024,
  footer: 60,
  buttonText: 25,
  buttons: 3,
  url: 2000,
  phone: 20,
  example: 200,
} as const;

export const WHATSAPP_TEMPLATE_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "en_US", label: "English (US)" },
  { code: "en_GB", label: "English (UK)" },
] as const;

const NAME_PATTERN = /^[a-z0-9_]+$/;
const LANGUAGE_PATTERN = /^[a-z]{2,3}(?:_[A-Z]{2})?$/;
const VARIABLE_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function normalizeWhatsAppTemplateName(value: unknown) {
  return clean(value, WHATSAPP_TEMPLATE_LIMITS.name)
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

export function listWhatsAppTemplateVariables(text: string | undefined) {
  if (!text) return [];
  const found: string[] = [];
  for (const match of text.matchAll(VARIABLE_PATTERN)) {
    const token = match[1];
    if (!found.includes(token)) found.push(token);
  }
  return found;
}

export function listWhatsAppTemplateDraftVariableFields(input: Pick<WhatsAppTemplateDraftInput, "headerText" | "bodyText">): WhatsAppTemplateVariableField[] {
  return [
    ...listWhatsAppTemplateVariables(input.headerText).map((token) => ({ key: `header:${token}`, component: "HEADER" as const, token })),
    ...listWhatsAppTemplateVariables(input.bodyText).map((token) => ({ key: `body:${token}`, component: "BODY" as const, token })),
  ];
}

export function validatePositionalWhatsAppTemplateVariables(tokens: string[], label = "Template") {
  if (tokens.some((token) => !/^\d+$/.test(token))) {
    return `${label} variables must use Meta positional placeholders such as {{1}}, {{2}} and {{3}}.`;
  }
  const numbers = Array.from(new Set(tokens.map(Number))).sort((a, b) => a - b);
  for (let index = 0; index < numbers.length; index += 1) {
    if (numbers[index] !== index + 1) return `${label} variables must be sequential: {{1}}, {{2}}, {{3}} without gaps.`;
  }
  return null;
}

function normalizeButton(raw: unknown): WhatsAppTemplateDraftButton | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const type = row.type;
  if (type !== "QUICK_REPLY" && type !== "URL" && type !== "PHONE_NUMBER") return null;
  const text = clean(row.text, WHATSAPP_TEMPLATE_LIMITS.buttonText);
  if (!text) return null;
  const value = clean(row.value, type === "URL" ? WHATSAPP_TEMPLATE_LIMITS.url : WHATSAPP_TEMPLATE_LIMITS.phone);
  return { type, text, ...(type === "QUICK_REPLY" ? {} : { value }) };
}

export type WhatsAppTemplateValidation =
  | { ok: true; value: WhatsAppTemplateDraftInput }
  | { ok: false; error: string };

export function validateWhatsAppTemplateDraftInput(raw: Record<string, unknown>): WhatsAppTemplateValidation {
  const name = normalizeWhatsAppTemplateName(raw.name);
  const language = clean(raw.language, 20);
  const category = raw.category === "MARKETING" || raw.category === "UTILITY" ? raw.category : null;
  const headerText = clean(raw.headerText, WHATSAPP_TEMPLATE_LIMITS.header);
  const bodyText = clean(raw.bodyText, WHATSAPP_TEMPLATE_LIMITS.body);
  const footerText = clean(raw.footerText, WHATSAPP_TEMPLATE_LIMITS.footer);
  const buttons = Array.isArray(raw.buttons)
    ? raw.buttons.map(normalizeButton).filter((button): button is WhatsAppTemplateDraftButton => Boolean(button))
    : [];
  const variableExamplesRaw = raw.variableExamples && typeof raw.variableExamples === "object" && !Array.isArray(raw.variableExamples)
    ? (raw.variableExamples as Record<string, unknown>)
    : {};
  const variableExamples: Record<string, string> = {};
  for (const [key, value] of Object.entries(variableExamplesRaw)) {
    if (/^(header|body):\d+$/.test(key) && typeof value === "string" && value.trim()) {
      variableExamples[key] = value.trim().slice(0, WHATSAPP_TEMPLATE_LIMITS.example);
    }
  }

  if (!name || !NAME_PATTERN.test(name)) return { ok: false, error: "Template names can contain lowercase letters, numbers, and underscores only." };
  if (!LANGUAGE_PATTERN.test(language)) return { ok: false, error: "Choose a valid Meta template language code." };
  if (!category) return { ok: false, error: "Choose Marketing or Utility for this template." };
  if (!bodyText) return { ok: false, error: "Template body text is required." };
  if (buttons.length > WHATSAPP_TEMPLATE_LIMITS.buttons) return { ok: false, error: `Use at most ${WHATSAPP_TEMPLATE_LIMITS.buttons} buttons in this first template manager release.` };

  const headerVariables = listWhatsAppTemplateVariables(headerText);
  if (headerVariables.length > 1) return { ok: false, error: "A text header can contain at most one variable." };
  const headerVariableError = validatePositionalWhatsAppTemplateVariables(headerVariables, "Header");
  if (headerVariableError) return { ok: false, error: headerVariableError };
  const bodyVariables = listWhatsAppTemplateVariables(bodyText);
  const bodyVariableError = validatePositionalWhatsAppTemplateVariables(bodyVariables, "Body");
  if (bodyVariableError) return { ok: false, error: bodyVariableError };

  const fields = listWhatsAppTemplateDraftVariableFields({ headerText, bodyText });
  for (const field of fields) {
    if (!variableExamples[field.key]) return { ok: false, error: `Add a sample value for ${field.component.toLowerCase()} {{${field.token}}} before saving or submitting.` };
  }

  const quickReplyCount = buttons.filter((button) => button.type === "QUICK_REPLY").length;
  const ctaCount = buttons.length - quickReplyCount;
  if (quickReplyCount && ctaCount) return { ok: false, error: "Keep Quick Reply buttons separate from Website/Phone buttons in one template." };
  if (buttons.filter((button) => button.type === "URL").length > 1 || buttons.filter((button) => button.type === "PHONE_NUMBER").length > 1) {
    return { ok: false, error: "Use at most one Website button and one Phone button." };
  }
  for (const button of buttons) {
    if (button.type === "URL") {
      try {
        const url = new URL(button.value || "");
        if (url.protocol !== "https:" && url.protocol !== "http:") throw new Error("bad protocol");
      } catch {
        return { ok: false, error: "Website buttons need a valid http or https URL." };
      }
    }
    if (button.type === "PHONE_NUMBER" && !/^\+?[0-9]{7,20}$/.test((button.value || "").replace(/[\s()-]/g, ""))) {
      return { ok: false, error: "Phone buttons need a valid international phone number." };
    }
  }

  return { ok: true, value: { name, language, category, headerText, bodyText, footerText, buttons, variableExamples } };
}

export function buildWhatsAppMetaTemplateComponents(input: WhatsAppTemplateDraftInput) {
  const components: Array<Record<string, unknown>> = [];
  if (input.headerText) {
    const variables = listWhatsAppTemplateVariables(input.headerText);
    components.push({
      type: "HEADER",
      format: "TEXT",
      text: input.headerText,
      ...(variables.length ? { example: { header_text: variables.map((token) => input.variableExamples[`header:${token}`]) } } : {}),
    });
  }
  const bodyVariables = listWhatsAppTemplateVariables(input.bodyText);
  components.push({
    type: "BODY",
    text: input.bodyText,
    ...(bodyVariables.length ? { example: { body_text: [bodyVariables.map((token) => input.variableExamples[`body:${token}`])] } } : {}),
  });
  if (input.footerText) components.push({ type: "FOOTER", text: input.footerText });
  if (input.buttons.length) {
    components.push({
      type: "BUTTONS",
      buttons: input.buttons.map((button) => {
        if (button.type === "URL") return { type: "URL", text: button.text, url: button.value };
        if (button.type === "PHONE_NUMBER") return { type: "PHONE_NUMBER", text: button.text, phone_number: button.value };
        return { type: "QUICK_REPLY", text: button.text };
      }),
    });
  }
  return components;
}

export function normalizeWhatsAppTemplateDraftRow(row: Record<string, unknown>): WhatsAppTemplateDraft {
  const buttons = Array.isArray(row.buttons) ? row.buttons.map(normalizeButton).filter((button): button is WhatsAppTemplateDraftButton => Boolean(button)) : [];
  const examples = row.variable_examples && typeof row.variable_examples === "object" && !Array.isArray(row.variable_examples)
    ? Object.fromEntries(Object.entries(row.variable_examples as Record<string, unknown>).filter(([, value]) => typeof value === "string")) as Record<string, string>
    : {};
  return {
    id: String(row.id || ""),
    name: String(row.name || ""),
    language: String(row.language || "en_US"),
    category: row.category === "MARKETING" ? "MARKETING" : "UTILITY",
    headerText: typeof row.header_text === "string" ? row.header_text : "",
    bodyText: typeof row.body_text === "string" ? row.body_text : "",
    footerText: typeof row.footer_text === "string" ? row.footer_text : "",
    buttons,
    variableExamples: examples,
    metaTemplateId: typeof row.meta_template_id === "string" ? row.meta_template_id : undefined,
    submittedAt: typeof row.submitted_at === "string" ? row.submitted_at : undefined,
    createdByMemberId: typeof row.created_by_member_id === "string" ? row.created_by_member_id : undefined,
    updatedByMemberId: typeof row.updated_by_member_id === "string" ? row.updated_by_member_id : undefined,
    createdAt: typeof row.created_at === "string" ? row.created_at : undefined,
    updatedAt: typeof row.updated_at === "string" ? row.updated_at : undefined,
  };
}
