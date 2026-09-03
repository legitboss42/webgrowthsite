import test from "node:test";
import assert from "node:assert/strict";
import { estimateWhatsAppAIMaxCost, rankWhatsAppAIModels, type WhatsAppAIGatewayModel } from "./aiProvider";

function model(id: string, inputPrice: number, outputPrice: number): WhatsAppAIGatewayModel {
  return { id, name: id, provider: id.split("/")[0] || "test", type: "language", inputPrice, outputPrice, contextWindow: 128000, maxTokens: 4096 };
}

test("automatic AI routing prefers economical lightweight models for assist work", () => {
  const ranked = rankWhatsAppAIModels([
    model("provider/expensive-pro", 0.00001, 0.00003),
    model("google/gemini-test-flash-lite", 0.0000001, 0.0000004),
    model("provider/mid-mini", 0.000001, 0.000003),
  ], "ASSIST");
  assert.equal(ranked[0]?.id, "google/gemini-test-flash-lite");
});

test("Free Only projected cost includes prompt estimate and full output ceiling", () => {
  const value = estimateWhatsAppAIMaxCost({
    messages: [{ role: "user", content: "A".repeat(360) }],
    maxOutputTokens: 100,
    model: model("test/model", 0.001, 0.002),
  });
  assert.ok(value !== null);
  assert.ok(value >= 0.3);
});

test("unpriced models cannot be used for a Free Only cost projection", () => {
  const value = estimateWhatsAppAIMaxCost({
    messages: [{ role: "user", content: "hello" }],
    maxOutputTokens: 100,
    model: { ...model("test/unpriced", 0, 0), inputPrice: null },
  });
  assert.equal(value, null);
});
