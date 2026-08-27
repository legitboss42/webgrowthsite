import assert from "node:assert/strict";
import test from "node:test";
import {
  WHATSAPP_MEDIA_CAPTION_MAX,
  WHATSAPP_MEDIA_KIND_ORDER,
  WHATSAPP_MEDIA_KINDS,
  formatWhatsAppMediaSize,
  getWhatsAppMediaAccept,
  isSupportedWhatsAppMediaMimeType,
  isWhatsAppMediaKind,
  resolveWhatsAppMediaKind,
  supportsWhatsAppMediaCaption,
  validateWhatsAppMediaFile,
} from "./media";

test("every kind in the order has a spec, and every spec is reachable", () => {
  assert.equal(WHATSAPP_MEDIA_KIND_ORDER.length, Object.keys(WHATSAPP_MEDIA_KINDS).length);
  for (const kind of WHATSAPP_MEDIA_KIND_ORDER) {
    const spec = WHATSAPP_MEDIA_KINDS[kind];
    assert.equal(spec.kind, kind);
    assert.ok(spec.label);
    assert.ok(spec.maxBytes > 0);
    assert.ok(spec.mimeTypes.length > 0);
    // The accept string has to name the type at least by its family, or a picker filters
    // out files the send route would happily forward.
    assert.ok(spec.accept.includes(`${kind}/`) || spec.accept.includes("application/"));
  }
});

test("isWhatsAppMediaKind rejects anything off the list", () => {
  assert.equal(isWhatsAppMediaKind("image"), true);
  assert.equal(isWhatsAppMediaKind("sticker"), false);
  assert.equal(isWhatsAppMediaKind(null), false);
  // Guards against a prototype key sneaking through an untrusted form field.
  assert.equal(isWhatsAppMediaKind("toString"), false);
});

test("mime matching ignores case and charset parameters", () => {
  assert.equal(isSupportedWhatsAppMediaMimeType("image", "image/PNG"), true);
  assert.equal(isSupportedWhatsAppMediaMimeType("document", "text/plain; charset=utf-8"), true);
  assert.equal(isSupportedWhatsAppMediaMimeType("image", "image/webp"), false);
  assert.equal(isSupportedWhatsAppMediaMimeType("audio", "audio/ogg; codecs=opus"), true);
});

test("resolveWhatsAppMediaKind sorts a file into the kind Meta would accept it as", () => {
  assert.equal(resolveWhatsAppMediaKind("image/jpeg"), "image");
  assert.equal(resolveWhatsAppMediaKind("video/mp4"), "video");
  assert.equal(resolveWhatsAppMediaKind("application/pdf"), "document");
  assert.equal(resolveWhatsAppMediaKind("audio/mpeg"), "audio");
  assert.equal(resolveWhatsAppMediaKind("image/heic"), null);
  assert.equal(resolveWhatsAppMediaKind(""), null);
});

test("formatWhatsAppMediaSize reads the way an operator would say it", () => {
  assert.equal(formatWhatsAppMediaSize(5 * 1024 * 1024), "5 MB");
  assert.equal(formatWhatsAppMediaSize(16 * 1024 * 1024), "16 MB");
  assert.equal(formatWhatsAppMediaSize(1_600_000), "1.5 MB");
  assert.equal(formatWhatsAppMediaSize(2048), "2 KB");
  assert.equal(formatWhatsAppMediaSize(10), "1 KB");
});

test("validateWhatsAppMediaFile accepts what the send route can actually forward", () => {
  const result = validateWhatsAppMediaFile({ mimeType: "image/png", size: 400_000, name: "shot.png" });
  assert.deepEqual(result, { ok: true, kind: "image" });
});

test("validateWhatsAppMediaFile names the ceiling it enforces", () => {
  const result = validateWhatsAppMediaFile({ mimeType: "image/png", size: 6 * 1024 * 1024 });
  assert.equal(result.ok, false);
  if (result.ok) return;
  assert.match(result.error, /Image files must be 5 MB or smaller/);
  assert.match(result.error, /This one is 6 MB/);
});

test("validateWhatsAppMediaFile refuses unsupported types and empty files", () => {
  const unsupported = validateWhatsAppMediaFile({ mimeType: "image/webp", size: 1000 });
  assert.equal(unsupported.ok, false);
  if (!unsupported.ok) assert.match(unsupported.error, /cannot send this file type \(image\/webp\)/);

  const empty = validateWhatsAppMediaFile({ mimeType: "application/pdf", size: 0 });
  assert.equal(empty.ok, false);
  if (!empty.ok) assert.match(empty.error, /empty/);
});

test("a video at exactly the ceiling is still allowed", () => {
  const result = validateWhatsAppMediaFile({ mimeType: "video/mp4", size: 16 * 1024 * 1024 });
  assert.deepEqual(result, { ok: true, kind: "video" });
});

test("the paperclip accept string covers every kind", () => {
  const accept = getWhatsAppMediaAccept();
  for (const kind of WHATSAPP_MEDIA_KIND_ORDER) {
    assert.ok(accept.includes(WHATSAPP_MEDIA_KINDS[kind].accept), `${kind} missing from accept`);
  }
});

test("captions follow Meta's rule: never on audio", () => {
  assert.equal(supportsWhatsAppMediaCaption("image"), true);
  assert.equal(supportsWhatsAppMediaCaption("video"), true);
  assert.equal(supportsWhatsAppMediaCaption("document"), true);
  assert.equal(supportsWhatsAppMediaCaption("audio"), false);
  assert.equal(WHATSAPP_MEDIA_CAPTION_MAX, 1024);
});
