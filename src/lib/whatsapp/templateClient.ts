import { listWhatsAppTemplateVariables } from "./templateModel";

export type WhatsAppTemplateStatus =
  | "APPROVED"
  | "PENDING"
  | "REJECTED"
  | "PAUSED"
  | "DISABLED"
  | "UNKNOWN";

export type WhatsAppTemplateButton = {
  type: string;
  text?: string;
  url?: string;
  phone_number?: string;
};

export type WhatsAppTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS" | "UNKNOWN";
  format?: string;
  text?: string;
  buttons?: WhatsAppTemplateButton[];
};

export type WhatsAppTemplate = {
  id: string;
  name: string;
  status: WhatsAppTemplateStatus;
  category?: string;
  language?: string;
  rejectedReason?: string;
  qualityScore?: string;
  lastUpdatedTime?: string;
  components: WhatsAppTemplateComponent[];
};

export function getWhatsAppTemplateComponent(
  template: WhatsAppTemplate,
  type: WhatsAppTemplateComponent["type"],
) {
  return template.components.find((component) => component.type === type);
}

export { listWhatsAppTemplateVariables };
