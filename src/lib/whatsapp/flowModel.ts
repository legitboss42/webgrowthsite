export const WHATSAPP_FLOW_CATEGORIES = [
  "SIGN_UP", "SIGN_IN", "APPOINTMENT_BOOKING", "LEAD_GENERATION", "CONTACT_US",
  "CUSTOMER_SUPPORT", "SURVEY", "OTHER",
] as const;
export type WhatsAppFlowCategory = (typeof WHATSAPP_FLOW_CATEGORIES)[number];

export const WHATSAPP_FLOW_STATUSES = ["DRAFT", "PUBLISHED", "DEPRECATED", "BLOCKED", "THROTTLED", "UNKNOWN"] as const;
export type WhatsAppFlowStatus = (typeof WHATSAPP_FLOW_STATUSES)[number];

export const WHATSAPP_FLOW_COMPONENT_TYPES = [
  "TextHeading", "TextBody", "TextCaption", "TextInput", "TextArea", "Dropdown",
  "RadioButtonsGroup", "CheckboxGroup", "DatePicker", "Image", "OptIn",
] as const;
export type WhatsAppFlowComponentType = (typeof WHATSAPP_FLOW_COMPONENT_TYPES)[number];

export type WhatsAppFlowOption = { id: string; title: string; description?: string };

export type WhatsAppFlowComponent = {
  id: string;
  type: WhatsAppFlowComponentType;
  name?: string;
  label?: string;
  text?: string;
  required?: boolean;
  inputType?: "text" | "email" | "number" | "phone" | "password";
  helperText?: string;
  options?: WhatsAppFlowOption[];
  src?: string;
};

export type WhatsAppFlowScreen = {
  id: string;
  title: string;
  components: WhatsAppFlowComponent[];
};

export type WhatsAppFlowBuilderDefinition = {
  screens: WhatsAppFlowScreen[];
  dynamic: boolean;
  completionButtonLabel: string;
};

export type WhatsAppFlowCrmMapping = Record<string, string>;

export type WhatsAppFlow = {
  id: string;
  metaFlowId?: string;
  name: string;
  categories: WhatsAppFlowCategory[];
  status: WhatsAppFlowStatus;
  jsonVersion: string;
  dataApiVersion?: string;
  endpointUri?: string;
  previewUrl?: string;
  previewExpiresAt?: string;
  healthStatus?: Record<string, unknown>;
  validationErrors: Array<Record<string, unknown>>;
  flowJson: Record<string, unknown>;
  builder: WhatsAppFlowBuilderDefinition;
  crmMapping: WhatsAppFlowCrmMapping;
  version: number;
  publishedAt?: string;
  deprecatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WhatsAppFlowSubmission = {
  id: string;
  flowId?: string;
  metaFlowId?: string;
  contactId?: string;
  conversationId?: string;
  flowToken?: string;
  messageId?: string;
  status: "STARTED" | "COMPLETED" | "FAILED";
  response: Record<string, unknown>;
  mappedFields: Record<string, unknown>;
  startedAt?: string;
  completedAt?: string;
  createdAt?: string;
};

export const WHATSAPP_FLOW_JSON_VERSION = "7.2";
export const WHATSAPP_FLOW_DATA_API_VERSION = "3.0";

function clean(value: unknown, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}
function object(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
function cleanId(value: unknown, fallback = "field") {
  const raw = clean(value, 80).replace(/[^A-Za-z0-9_]/g, "_").replace(/^_+|_+$/g, "");
  return (raw || fallback).slice(0, 80);
}
function uniqueId(base: string, used: Set<string>) {
  let id = cleanId(base).toUpperCase();
  let suffix = 2;
  while (used.has(id)) id = `${cleanId(base).toUpperCase()}_${suffix++}`;
  used.add(id);
  return id;
}
function componentName(component: WhatsAppFlowComponent, index: number) {
  return cleanId(component.name || component.label || `${component.type}_${index + 1}`).toLowerCase();
}
function isInput(component: WhatsAppFlowComponent) {
  return new Set(["TextInput", "TextArea", "Dropdown", "RadioButtonsGroup", "CheckboxGroup", "DatePicker", "OptIn"]).has(component.type);
}
function optionRows(options: WhatsAppFlowOption[] | undefined) {
  return (options || []).map((option, index) => ({
    id: cleanId(option.id || `option_${index + 1}`).toLowerCase(),
    title: clean(option.title, 30) || `Option ${index + 1}`,
    ...(clean(option.description, 300) ? { description: clean(option.description, 300) } : {}),
  }));
}

export function createWhatsAppFlowComponent(type: WhatsAppFlowComponentType, index = 0): WhatsAppFlowComponent {
  const id = `${type.toLowerCase()}_${Date.now().toString(36)}_${index}`;
  if (type === "TextHeading") return { id, type, text: "Section heading" };
  if (type === "TextBody") return { id, type, text: "Add helpful context for the customer." };
  if (type === "TextCaption") return { id, type, text: "Helpful note" };
  if (type === "Image") return { id, type, src: "" };
  if (type === "TextArea") return { id, type, name: `details_${index + 1}`, label: "Details", required: false };
  if (type === "DatePicker") return { id, type, name: `date_${index + 1}`, label: "Choose a date", required: true };
  if (type === "OptIn") return { id, type, name: `consent_${index + 1}`, label: "I agree", required: true };
  if (type === "Dropdown" || type === "RadioButtonsGroup" || type === "CheckboxGroup") {
    return {
      id, type, name: `choice_${index + 1}`, label: "Choose an option", required: true,
      options: [{ id: "option_1", title: "Option 1" }, { id: "option_2", title: "Option 2" }],
    };
  }
  return { id, type, name: `field_${index + 1}`, label: "Your answer", required: true, inputType: "text" };
}

export function createWhatsAppFlowScreen(index = 0): WhatsAppFlowScreen {
  return {
    id: index === 0 ? "START" : `SCREEN_${index + 1}`,
    title: index === 0 ? "Get started" : `Step ${index + 1}`,
    components: [
      createWhatsAppFlowComponent("TextHeading", index),
      createWhatsAppFlowComponent("TextInput", index),
    ],
  };
}

export const WHATSAPP_FLOW_STARTERS: Array<{
  key: string;
  label: string;
  category: WhatsAppFlowCategory;
  description: string;
  builder: WhatsAppFlowBuilderDefinition;
  crmMapping: WhatsAppFlowCrmMapping;
}> = [
  {
    key: "lead-generation", label: "Lead generation", category: "LEAD_GENERATION", description: "Capture service, budget, timeline and contact details.",
    builder: {
      dynamic: false, completionButtonLabel: "Submit request", screens: [
        { id: "PROJECT", title: "Your project", components: [
          { id: "h1", type: "TextHeading", text: "Tell us what you need" },
          { id: "service", type: "Dropdown", name: "service", label: "Service", required: true, options: [
            { id: "website", title: "Business website" }, { id: "landing", title: "Landing page" },
            { id: "ecommerce", title: "Ecommerce" }, { id: "automation", title: "Automation" }, { id: "seo", title: "SEO" },
          ] },
          { id: "budget", type: "Dropdown", name: "budget", label: "Budget", required: true, options: [
            { id: "under_300k", title: "Under ₦300k" }, { id: "300_500k", title: "₦300k–₦500k" },
            { id: "500k_plus", title: "₦500k+" },
          ] },
          { id: "timeline", type: "Dropdown", name: "timeline", label: "Timeline", required: true, options: [
            { id: "30_days", title: "Within 30 days" }, { id: "60_days", title: "Within 60 days" }, { id: "exploring", title: "Just exploring" },
          ] },
        ] },
        { id: "CONTACT", title: "Contact details", components: [
          { id: "h2", type: "TextHeading", text: "Where should we follow up?" },
          { id: "name", type: "TextInput", name: "full_name", label: "Full name", required: true, inputType: "text" },
          { id: "email", type: "TextInput", name: "email", label: "Email", required: true, inputType: "email" },
        ] },
      ],
    },
    crmMapping: { full_name: "display_name", email: "email", service: "custom.service", budget: "custom.budget", timeline: "custom.timeline" },
  },
  {
    key: "appointment", label: "Appointment booking", category: "APPOINTMENT_BOOKING", description: "Collect service, preferred date/time and contact details.",
    builder: {
      dynamic: true, completionButtonLabel: "Confirm booking", screens: [
        { id: "BOOK", title: "Book appointment", components: [
          { id: "bookh", type: "TextHeading", text: "Choose your appointment" },
          { id: "service", type: "Dropdown", name: "service", label: "Service", required: true, options: [{ id: "consultation", title: "Consultation" }, { id: "support", title: "Support session" }] },
          { id: "date", type: "DatePicker", name: "date", label: "Preferred date", required: true },
          { id: "time", type: "Dropdown", name: "time", label: "Preferred time", required: true, options: [{ id: "morning", title: "Morning" }, { id: "afternoon", title: "Afternoon" }, { id: "evening", title: "Evening" }] },
        ] },
        { id: "CONTACT", title: "Your details", components: [
          { id: "name", type: "TextInput", name: "full_name", label: "Full name", required: true },
          { id: "email", type: "TextInput", name: "email", label: "Email", required: true, inputType: "email" },
        ] },
      ],
    },
    crmMapping: { full_name: "display_name", email: "email", service: "custom.booking_service", date: "custom.booking_date", time: "custom.booking_time" },
  },
  {
    key: "support", label: "Customer support", category: "CUSTOMER_SUPPORT", description: "Capture issue category, reference and description.",
    builder: { dynamic: false, completionButtonLabel: "Submit issue", screens: [{ id: "SUPPORT", title: "Get support", components: [
      { id: "sh", type: "TextHeading", text: "How can we help?" },
      { id: "category", type: "Dropdown", name: "issue_category", label: "Issue category", required: true, options: [{ id: "billing", title: "Billing" }, { id: "technical", title: "Technical" }, { id: "account", title: "Account" }, { id: "other", title: "Other" }] },
      { id: "reference", type: "TextInput", name: "reference", label: "Order or reference number", required: false },
      { id: "details", type: "TextArea", name: "details", label: "Describe the issue", required: true },
    ] }] },
    crmMapping: { issue_category: "custom.support_category", reference: "custom.support_reference", details: "custom.support_details" },
  },
  {
    key: "contact", label: "Contact us", category: "CONTACT_US", description: "Simple contact and enquiry form.",
    builder: { dynamic: false, completionButtonLabel: "Send enquiry", screens: [{ id: "CONTACT", title: "Contact us", components: [
      { id: "ch", type: "TextHeading", text: "Send us a message" },
      { id: "reason", type: "Dropdown", name: "reason", label: "Reason", required: true, options: [{ id: "sales", title: "Sales" }, { id: "support", title: "Support" }, { id: "partnership", title: "Partnership" }, { id: "other", title: "Other" }] },
      { id: "name", type: "TextInput", name: "full_name", label: "Full name", required: true },
      { id: "email", type: "TextInput", name: "email", label: "Email", required: true, inputType: "email" },
      { id: "message", type: "TextArea", name: "message", label: "Message", required: true },
    ] }] },
    crmMapping: { full_name: "display_name", email: "email", reason: "custom.contact_reason", message: "custom.contact_message" },
  },
  {
    key: "survey", label: "Survey / feedback", category: "SURVEY", description: "Collect rating, recommendation and comments.",
    builder: { dynamic: false, completionButtonLabel: "Submit feedback", screens: [{ id: "FEEDBACK", title: "Your feedback", components: [
      { id: "fh", type: "TextHeading", text: "How did we do?" },
      { id: "rating", type: "RadioButtonsGroup", name: "rating", label: "Rating", required: true, options: [1,2,3,4,5].map((value) => ({ id: String(value), title: `${value} / 5` })) },
      { id: "recommend", type: "RadioButtonsGroup", name: "recommend", label: "Would you recommend us?", required: true, options: [{ id: "yes", title: "Yes" }, { id: "maybe", title: "Maybe" }, { id: "no", title: "No" }] },
      { id: "comments", type: "TextArea", name: "comments", label: "Comments", required: false },
    ] }] },
    crmMapping: { rating: "custom.feedback_rating", recommend: "custom.feedback_recommend", comments: "custom.feedback_comments" },
  },
  {
    key: "quote", label: "Quote request", category: "LEAD_GENERATION", description: "Capture service scope, budget and deadline.",
    builder: { dynamic: false, completionButtonLabel: "Request quote", screens: [{ id: "QUOTE", title: "Request a quote", components: [
      { id: "qh", type: "TextHeading", text: "Tell us about your project" },
      { id: "service", type: "TextInput", name: "service", label: "Service needed", required: true },
      { id: "requirements", type: "TextArea", name: "requirements", label: "Requirements", required: true },
      { id: "budget", type: "TextInput", name: "budget", label: "Budget", required: false },
      { id: "deadline", type: "DatePicker", name: "deadline", label: "Target deadline", required: false },
      { id: "email", type: "TextInput", name: "email", label: "Email", required: true, inputType: "email" },
    ] }] },
    crmMapping: { email: "email", service: "custom.quote_service", requirements: "custom.quote_requirements", budget: "custom.quote_budget", deadline: "custom.quote_deadline" },
  },
  {
    key: "registration", label: "Registration", category: "SIGN_UP", description: "Capture personal/business details and consent.",
    builder: { dynamic: false, completionButtonLabel: "Register", screens: [{ id: "REGISTER", title: "Registration", components: [
      { id: "rh", type: "TextHeading", text: "Create your registration" },
      { id: "name", type: "TextInput", name: "full_name", label: "Full name", required: true },
      { id: "email", type: "TextInput", name: "email", label: "Email", required: true, inputType: "email" },
      { id: "company", type: "TextInput", name: "company", label: "Business name", required: false },
      { id: "consent", type: "OptIn", name: "consent", label: "I agree to be contacted about this registration", required: true },
    ] }] },
    crmMapping: { full_name: "display_name", email: "email", company: "company", consent: "custom.registration_consent" },
  },
];

export function validateWhatsAppFlowBuilder(builder: WhatsAppFlowBuilderDefinition) {
  if (!Array.isArray(builder.screens) || builder.screens.length < 1) return "Add at least one Flow screen.";
  if (builder.screens.length > 20) return "Use at most 20 screens in one Flow.";
  const screenIds = new Set<string>();
  const fieldNames = new Set<string>();
  for (const [screenIndex, screen] of builder.screens.entries()) {
    const id = cleanId(screen.id, `SCREEN_${screenIndex + 1}`).toUpperCase();
    if (id === "SUCCESS") return "SUCCESS is reserved by Meta and cannot be used as a screen ID.";
    if (screenIds.has(id)) return `Screen ID ${id} is duplicated.`;
    screenIds.add(id);
    if (!clean(screen.title, 80)) return `Screen ${screenIndex + 1} needs a title.`;
    if (!Array.isArray(screen.components) || !screen.components.length) return `Screen ${screenIndex + 1} needs at least one component.`;
    if (screen.components.length > 50) return `Screen ${screenIndex + 1} has too many components.`;
    for (const [componentIndex, component] of screen.components.entries()) {
      if (!(WHATSAPP_FLOW_COMPONENT_TYPES as readonly string[]).includes(component.type)) return `Screen ${screenIndex + 1}, component ${componentIndex + 1} is not supported.`;
      if (isInput(component)) {
        const name = componentName(component, componentIndex);
        if (fieldNames.has(name)) return `Input name “${name}” is duplicated. Use unique field names across the Flow.`;
        fieldNames.add(name);
        if (!clean(component.label, 80)) return `${component.type} “${name}” needs a label.`;
        if (new Set(["Dropdown", "RadioButtonsGroup", "CheckboxGroup"]).has(component.type) && optionRows(component.options).length < 1) return `${component.type} “${name}” needs at least one option.`;
      }
      if (new Set(["TextHeading", "TextBody", "TextCaption"]).has(component.type) && !clean(component.text, 4096)) return `${component.type} needs text.`;
      if (component.type === "Image" && component.src && !/^https:\/\//i.test(component.src)) return "Flow images must use an HTTPS URL.";
    }
  }
  return null;
}

function inputComponent(component: WhatsAppFlowComponent, index: number) {
  const name = componentName(component, index);
  const label = clean(component.label, 80) || "Field";
  const base: Record<string, unknown> = { type: component.type, name, label, required: component.required !== false };
  if (component.helperText) base["helper-text"] = clean(component.helperText, 300);
  if (component.type === "TextInput") base["input-type"] = component.inputType || "text";
  if (component.type === "Dropdown" || component.type === "RadioButtonsGroup" || component.type === "CheckboxGroup") base["data-source"] = optionRows(component.options);
  return base;
}

function screenFormPayload(screen: WhatsAppFlowScreen) {
  const payload: Record<string, string> = {};
  screen.components.forEach((component, index) => {
    if (isInput(component)) {
      const name = componentName(component, index);
      payload[name] = `\${form.${name}}`;
    }
  });
  return payload;
}

export function buildWhatsAppFlowJson(builder: WhatsAppFlowBuilderDefinition) {
  const validation = validateWhatsAppFlowBuilder(builder);
  if (validation) throw new Error(validation);
  const used = new Set<string>();
  const normalizedScreens = builder.screens.map((screen, index) => ({ ...screen, id: uniqueId(screen.id || `SCREEN_${index + 1}`, used) }));
  const routing: Record<string, string[]> = {};
  normalizedScreens.forEach((screen, index) => { routing[screen.id] = normalizedScreens[index + 1] ? [normalizedScreens[index + 1].id] : []; });

  const carried = new Map<string, { type: string; example: unknown }>();
  const screens = normalizedScreens.map((screen, screenIndex) => {
    const terminal = screenIndex === normalizedScreens.length - 1;
    const children: Array<Record<string, unknown>> = [];
    const formChildren: Array<Record<string, unknown>> = [];
    screen.components.forEach((component, componentIndex) => {
      if (component.type === "TextHeading" || component.type === "TextBody" || component.type === "TextCaption") {
        children.push({ type: component.type, text: clean(component.text, 4096) });
      } else if (component.type === "Image") {
        if (component.src) children.push({ type: "Image", src: component.src, "scale-type": "contain", width: 320, height: 160 });
      } else {
        formChildren.push(inputComponent(component, componentIndex));
      }
    });

    const currentPayload = screenFormPayload(screen);
    const payload: Record<string, string> = {};
    for (const key of carried.keys()) payload[key] = `\${data.${key}}`;
    Object.assign(payload, currentPayload);
    const next = normalizedScreens[screenIndex + 1];
    const action = builder.dynamic
      ? { name: "data_exchange", payload }
      : terminal
        ? { name: "complete", payload }
        : { name: "navigate", next: { type: "screen", name: next.id }, payload };
    formChildren.push({ type: "Footer", label: terminal ? clean(builder.completionButtonLabel, 30) || "Submit" : "Continue", "on-click-action": action });
    if (formChildren.length) children.push({ type: "Form", name: `form_${screen.id.toLowerCase()}`, children: formChildren });

    const data: Record<string, unknown> = {};
    for (const [key, info] of carried.entries()) {
      data[key] = info.type === "array"
        ? { type: "array", items: { type: "string" }, __example__: info.example }
        : { type: info.type, __example__: info.example };
    }
    screen.components.forEach((component, componentIndex) => {
      if (!isInput(component)) return;
      const name = componentName(component, componentIndex);
      carried.set(name, {
        type: component.type === "CheckboxGroup" ? "array" : component.type === "OptIn" ? "boolean" : "string",
        example: component.type === "CheckboxGroup" ? [] : component.type === "OptIn" ? true : "sample",
      });
    });

    return {
      id: screen.id,
      title: clean(screen.title, 80),
      ...(screenIndex > 0 && Object.keys(data).length ? { data } : {}),
      ...(terminal ? { terminal: true, success: true } : {}),
      layout: { type: "SingleColumnLayout", children },
    };
  });

  return {
    version: WHATSAPP_FLOW_JSON_VERSION,
    ...(builder.dynamic ? { data_api_version: WHATSAPP_FLOW_DATA_API_VERSION, routing_model: routing } : {}),
    screens,
  } as Record<string, unknown>;
}

export function normalizeWhatsAppFlowRow(row: Record<string, unknown>): WhatsAppFlow {
  const rawBuilder = object(row.builder_definition);
  const screens = Array.isArray(rawBuilder.screens) ? rawBuilder.screens as WhatsAppFlowScreen[] : [];
  const builder: WhatsAppFlowBuilderDefinition = {
    screens,
    dynamic: rawBuilder.dynamic === true,
    completionButtonLabel: clean(rawBuilder.completionButtonLabel, 30) || "Submit",
  };
  const categories = Array.isArray(row.categories)
    ? row.categories.filter((value): value is WhatsAppFlowCategory => typeof value === "string" && (WHATSAPP_FLOW_CATEGORIES as readonly string[]).includes(value))
    : ["OTHER" as const];
  const statusRaw = clean(row.status, 30).toUpperCase();
  return {
    id: String(row.id || ""),
    metaFlowId: clean(row.meta_flow_id, 120) || undefined,
    name: clean(row.name, 80) || "Untitled Flow",
    categories: categories.length ? categories : ["OTHER"],
    status: (WHATSAPP_FLOW_STATUSES as readonly string[]).includes(statusRaw) ? statusRaw as WhatsAppFlowStatus : "UNKNOWN",
    jsonVersion: clean(row.json_version, 20) || WHATSAPP_FLOW_JSON_VERSION,
    dataApiVersion: clean(row.data_api_version, 20) || undefined,
    endpointUri: clean(row.endpoint_uri, 1000) || undefined,
    previewUrl: clean(row.preview_url, 1500) || undefined,
    previewExpiresAt: clean(row.preview_expires_at, 80) || undefined,
    healthStatus: Object.keys(object(row.health_status)).length ? object(row.health_status) : undefined,
    validationErrors: Array.isArray(row.validation_errors) ? row.validation_errors.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object" && !Array.isArray(item))) : [],
    flowJson: object(row.flow_json),
    builder,
    crmMapping: Object.fromEntries(Object.entries(object(row.crm_mapping)).filter((entry): entry is [string, string] => typeof entry[1] === "string")),
    version: Math.max(1, Number(row.version) || 1),
    publishedAt: clean(row.published_at, 80) || undefined,
    deprecatedAt: clean(row.deprecated_at, 80) || undefined,
    createdAt: clean(row.created_at, 80) || undefined,
    updatedAt: clean(row.updated_at, 80) || undefined,
  };
}

export function normalizeWhatsAppFlowSubmissionRow(row: Record<string, unknown>): WhatsAppFlowSubmission {
  return {
    id: String(row.id || ""),
    flowId: clean(row.flow_id, 120) || undefined,
    metaFlowId: clean(row.meta_flow_id, 120) || undefined,
    contactId: clean(row.contact_id, 120) || undefined,
    conversationId: clean(row.conversation_id, 120) || undefined,
    flowToken: clean(row.flow_token, 500) || undefined,
    messageId: clean(row.message_id, 500) || undefined,
    status: (["STARTED", "COMPLETED", "FAILED"].includes(clean(row.status, 20).toUpperCase()) ? clean(row.status, 20).toUpperCase() : "FAILED") as WhatsAppFlowSubmission["status"],
    response: object(row.response_json),
    mappedFields: object(row.mapped_fields),
    startedAt: clean(row.started_at, 80) || undefined,
    completedAt: clean(row.completed_at, 80) || undefined,
    createdAt: clean(row.created_at, 80) || undefined,
  };
}

export function validateWhatsAppFlowInput(value: Record<string, unknown>) {
  const name = clean(value.name, 80);
  if (name.length < 2) return { ok: false as const, error: "Flow name must be at least 2 characters." };
  const categories = Array.isArray(value.categories)
    ? value.categories.filter((item): item is WhatsAppFlowCategory => typeof item === "string" && (WHATSAPP_FLOW_CATEGORIES as readonly string[]).includes(item))
    : [];
  if (!categories.length) return { ok: false as const, error: "Choose at least one Meta Flow category." };
  const rawBuilder = object(value.builder);
  const builder: WhatsAppFlowBuilderDefinition = {
    screens: Array.isArray(rawBuilder.screens) ? rawBuilder.screens as WhatsAppFlowScreen[] : [],
    dynamic: rawBuilder.dynamic === true,
    completionButtonLabel: clean(rawBuilder.completionButtonLabel, 30) || "Submit",
  };
  const error = validateWhatsAppFlowBuilder(builder);
  if (error) return { ok: false as const, error };
  const crmMapping = Object.fromEntries(Object.entries(object(value.crmMapping)).filter((entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].trim().length > 0));
  return { ok: true as const, value: { name, categories, builder, crmMapping, flowJson: buildWhatsAppFlowJson(builder) } };
}
