import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWhatsAppMetaTemplateComponents,
  listWhatsAppTemplateDraftVariableFields,
  normalizeWhatsAppTemplateName,
  validateWhatsAppTemplateDraftInput,
} from "./templateModel";

test("template names normalize to Meta-safe lowercase underscores", () => {
  assert.equal(normalizeWhatsAppTemplateName(" Order Update "), "order_update");
  assert.equal(normalizeWhatsAppTemplateName("VIP-Follow Up!"), "vip_follow_up");
});

test("header and body variables stay component-scoped", () => {
  assert.deepEqual(
    listWhatsAppTemplateDraftVariableFields({ headerText: "Hi {{1}}", bodyText: "Order {{1}} for {{2}}" }),
    [
      { key: "header:1", component: "HEADER", token: "1" },
      { key: "body:1", component: "BODY", token: "1" },
      { key: "body:2", component: "BODY", token: "2" },
    ],
  );
});

test("valid utility template is normalized", () => {
  const result = validateWhatsAppTemplateDraftInput({
    name: " Order Update ",
    language: "en_US",
    category: "UTILITY",
    headerText: "Hello {{1}}",
    bodyText: "Your order {{1}} is ready.",
    footerText: "Web Growth",
    variableExamples: { "header:1": "Victor", "body:1": "WG-100" },
    buttons: [{ type: "URL", text: "Track order", value: "https://webgrowth.info/order" }],
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.name, "order_update");
});

test("body variables must be sequential and every component variable needs an example", () => {
  assert.equal(validateWhatsAppTemplateDraftInput({
    name: "broken",
    language: "en_US",
    category: "UTILITY",
    bodyText: "Hello {{2}}",
    headerText: "",
    footerText: "",
    buttons: [],
    variableExamples: { "body:2": "Victor" },
  }).ok, false);

  assert.equal(validateWhatsAppTemplateDraftInput({
    name: "missing_example",
    language: "en_US",
    category: "UTILITY",
    headerText: "Hi {{1}}",
    bodyText: "Order {{1}}",
    footerText: "",
    buttons: [],
    variableExamples: { "header:1": "Victor" },
  }).ok, false);
});

test("named variables are rejected in the production builder", () => {
  assert.equal(validateWhatsAppTemplateDraftInput({
    name: "named",
    language: "en_US",
    category: "MARKETING",
    bodyText: "Hello {{first_name}}",
    headerText: "",
    footerText: "",
    buttons: [],
    variableExamples: {},
  }).ok, false);
});

test("quick replies cannot be mixed with CTA buttons", () => {
  const result = validateWhatsAppTemplateDraftInput({
    name: "mixed_buttons",
    language: "en_US",
    category: "MARKETING",
    bodyText: "Hello",
    headerText: "",
    footerText: "",
    variableExamples: {},
    buttons: [
      { type: "QUICK_REPLY", text: "Interested" },
      { type: "URL", text: "Visit", value: "https://webgrowth.info" },
    ],
  });
  assert.equal(result.ok, false);
});

test("Meta components contain separate header and body examples", () => {
  const components = buildWhatsAppMetaTemplateComponents({
    name: "order_update",
    language: "en_US",
    category: "UTILITY",
    headerText: "Hello {{1}}",
    bodyText: "Order {{1}} is ready",
    footerText: "Thanks",
    variableExamples: { "header:1": "Victor", "body:1": "WG-100" },
    buttons: [{ type: "PHONE_NUMBER", text: "Call us", value: "+2348066706336" }],
  });
  assert.deepEqual(components[0], {
    type: "HEADER",
    format: "TEXT",
    text: "Hello {{1}}",
    example: { header_text: ["Victor"] },
  });
  assert.deepEqual(components[1], {
    type: "BODY",
    text: "Order {{1}} is ready",
    example: { body_text: [["WG-100"]] },
  });
});
