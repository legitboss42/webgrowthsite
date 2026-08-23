import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import {
  parseFFprobeOutput,
  parseVideoContainerSignature,
  probeStoredVideoStream,
  probeVideo,
  validateTikTokVideo,
  VideoProbeInfrastructureError,
  VideoProbeMediaError,
  type VideoContainerEvidence,
  type VideoProbe,
} from "./videoValidation";

const evidence = {
  MP4: { container: "MP4", mimeType: "video/mp4", majorBrand: "isom" },
  MOV: { container: "MOV", mimeType: "video/quicktime", majorBrand: "qt  " },
  WEBM: { container: "WEBM", mimeType: "video/webm", majorBrand: null },
} as const satisfies Record<string, VideoContainerEvidence>;

const { rawMp4: rawProbe } = JSON.parse(readFileSync(
  new URL("./fixtures/videoProbeFixtures.json", import.meta.url),
  "utf8",
));

const passingProbe: VideoProbe = {
  container: "MP4", mimeType: "video/mp4", formatName: "mov,mp4,m4a,3gp,3g2,mj2", majorBrand: "isom",
  codecName: "h264", width: 1080, height: 1920, frameRate: 30, durationSeconds: 60,
};

test("stored byte signatures distinguish MP4, MOV, and WebM without a filename or browser MIME", () => {
  const iso = (brand: string) => Buffer.concat([Buffer.from([0, 0, 0, 20]), Buffer.from("ftyp"), Buffer.from(brand), Buffer.alloc(8)]);
  assert.deepEqual(parseVideoContainerSignature(iso("isom")), evidence.MP4);
  assert.deepEqual(parseVideoContainerSignature(iso("XMP4")), { ...evidence.MP4, majorBrand: "XMP4" });
  assert.deepEqual(parseVideoContainerSignature(iso("qt  ")), evidence.MOV);
  assert.deepEqual(parseVideoContainerSignature(Buffer.concat([
    Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0x01, 0x02]),
    Buffer.from("webm"),
  ])), evidence.WEBM);
  assert.throws(() => parseVideoContainerSignature(iso("3gp5")), /Video container must be MP4, MOV, or WebM\./);
  assert.throws(() => parseVideoContainerSignature(Buffer.from("not-media")), /Video container must be MP4, MOV, or WebM\./);
});

test("raw parser handles NTSC rational frame rate", () => {
  const parsed = parseFFprobeOutput({ ...rawProbe, streams: [{ ...rawProbe.streams[0], avg_frame_rate: "30000/1001" }] }, evidence.MP4);
  assert.equal(parsed.frameRate, 30000 / 1001);
});

test("raw parser falls back from 0/0 average frame rate", () => {
  const parsed = parseFFprobeOutput({ ...rawProbe, streams: [{ ...rawProbe.streams[0], avg_frame_rate: "0/0", r_frame_rate: "24/1" }] }, evidence.MP4);
  assert.equal(parsed.frameRate, 24);
});

test("raw parser rejects malformed multi-slash frame rate", () => {
  const parsed = parseFFprobeOutput({ ...rawProbe, streams: [{ ...rawProbe.streams[0], avg_frame_rate: "30/1/2", r_frame_rate: "also-bad" }] }, evidence.MP4);
  assert.equal(Number.isNaN(parsed.frameRate), true);
});

test("raw parser leaves absent duration invalid instead of inventing a value", () => {
  const parsed = parseFFprobeOutput({
    ...rawProbe,
    streams: [{ ...rawProbe.streams[0], duration: undefined }],
    format: { ...rawProbe.format, duration: undefined },
  }, evidence.MP4);
  assert.equal(Number.isNaN(parsed.durationSeconds), true);
});

test("raw parser ignores attached pictures and selects the sole substantive video", () => {
  const parsed = parseFFprobeOutput({ ...rawProbe, streams: [
    { ...rawProbe.streams[0], index: 0, codec_name: "mjpeg", disposition: { default: 0, attached_pic: 1 } },
    { ...rawProbe.streams[0], index: 1, codec_name: "vp9", disposition: { default: 0, attached_pic: 0 } },
  ], format: { format_name: "matroska,webm", duration: "60" } }, evidence.WEBM);
  assert.equal(parsed.codecName, "vp9");
});

test("raw parser selects one explicit default among multiple substantive streams", () => {
  const parsed = parseFFprobeOutput({ ...rawProbe, streams: [
    { ...rawProbe.streams[0], index: 0, codec_name: "h264", disposition: { default: 0, attached_pic: 0 } },
    { ...rawProbe.streams[0], index: 1, codec_name: "hevc", disposition: { default: 1, attached_pic: 0 } },
  ] }, evidence.MOV);
  assert.equal(parsed.codecName, "h265");
});

test("raw parser rejects missing or ambiguous substantive streams", () => {
  assert.throws(() => parseFFprobeOutput({ streams: [], format: rawProbe.format }, evidence.MP4), VideoProbeMediaError);
  assert.throws(() => parseFFprobeOutput({ ...rawProbe, streams: [
    { ...rawProbe.streams[0], index: 0, disposition: { default: 0, attached_pic: 0 } },
    { ...rawProbe.streams[0], index: 1, disposition: { default: 0, attached_pic: 0 } },
  ] }, evidence.MP4), VideoProbeMediaError);
});

test("raw parser requires container evidence compatible with the demuxer", () => {
  assert.equal(parseFFprobeOutput(rawProbe, evidence.MP4).mimeType, "video/mp4");
  assert.equal(parseFFprobeOutput(rawProbe, evidence.MOV).mimeType, "video/quicktime");
  assert.equal(parseFFprobeOutput({ ...rawProbe, format: { format_name: "matroska,webm", duration: "60" } }, evidence.WEBM).mimeType, "video/webm");
  assert.throws(() => parseFFprobeOutput(rawProbe, evidence.WEBM), VideoProbeMediaError);
});

for (const [container, mimeType] of [["MP4", "video/mp4"], ["MOV", "video/quicktime"], ["WEBM", "video/webm"]] as const) {
  for (const codecName of ["h264", "h265", "vp8", "vp9"] as const) {
    test(`${container} with ${codecName} passes the approved container and codec policy`, () => {
      assert.deepEqual(validateTikTokVideo({ ...passingProbe, container, mimeType, codecName }, 1024, 60), { ok: true });
    });
  }
}

test("unsupported container and codec return exact allowlisted messages", () => {
  assert.deepEqual(validateTikTokVideo({ ...passingProbe, container: "UNKNOWN", mimeType: "application/octet-stream" }, 1024, 60), { ok: false, error: "Video container must be MP4, MOV, or WebM." });
  assert.deepEqual(validateTikTokVideo({ ...passingProbe, codecName: "av1" }, 1024, 60), { ok: false, error: "Video codec must be H.264, H.265, VP8, or VP9." });
});

for (const [override, message] of [
  [{ frameRate: 22 }, "Video frame rate must be between 23 and 60 FPS."],
  [{ frameRate: 61 }, "Video frame rate must be between 23 and 60 FPS."],
  [{ width: 359 }, "Video dimensions must be between 360 and 4096 pixels."],
  [{ height: 4097 }, "Video dimensions must be between 360 and 4096 pixels."],
] as const) {
  test(`${JSON.stringify(override)} fails with the exact property message`, () => {
    assert.deepEqual(validateTikTokVideo({ ...passingProbe, ...override }, 1024, 60), { ok: false, error: message });
  });
}

test("duration requires a current positive creator maximum", () => {
  assert.deepEqual(validateTikTokVideo(passingProbe, 1024), { ok: false, error: "Current TikTok video duration limit is unavailable." });
  assert.deepEqual(validateTikTokVideo(passingProbe, 1024, 0), { ok: false, error: "Current TikTok video duration limit is unavailable." });
  assert.deepEqual(validateTikTokVideo({ ...passingProbe, durationSeconds: 61 }, 1024, 60), { ok: false, error: "Video duration exceeds the current TikTok creator limit." });
});

test("video size accepts exactly 500 MiB and rejects one byte more", () => {
  assert.equal(validateTikTokVideo(passingProbe, 500 * 1024 * 1024, 60).ok, true);
  assert.deepEqual(validateTikTokVideo(passingProbe, 500 * 1024 * 1024 + 1, 60), { ok: false, error: "Video size must not exceed 500 MB." });
});

async function* chunks(...values: number[][]) { for (const value of values) yield new Uint8Array(value); }

test("streamed stored video counts bytes, uses a neutral suffix, and cleans up after probe", async () => {
  let temporaryPath = "";
  const result = await probeStoredVideoStream(chunks([1, 2], [3]), 3, { async probe(path) {
    temporaryPath = path;
    assert.equal(path.endsWith(".media"), true);
    assert.equal(existsSync(path), true);
    return passingProbe;
  } });
  assert.deepEqual(result, passingProbe);
  assert.equal(existsSync(temporaryPath), false);
});

test("streamed stored video rejects byte mismatch and bounded overflow before probe", async () => {
  let probes = 0;
  const dependencies = { maximumBytes: 3, async probe() { probes += 1; return passingProbe; } };
  await assert.rejects(probeStoredVideoStream(chunks([1, 2]), 3, dependencies), /Stored video byte size does not match the reserved upload\./);
  await assert.rejects(probeStoredVideoStream(chunks([1, 2], [3, 4]), 4, dependencies), /Video size must not exceed 500 MB\./);
  assert.equal(probes, 0);
});

test("probe process uses fixed no-shell arguments and classifies timeout as infrastructure", async () => {
  let invocation: unknown[] = [];
  await assert.rejects(probeVideo("C:\\temp\\random.media", {
    detectContainer: async () => evidence.MP4,
    execFile: ((file: string, args: string[], options: object, callback: (error: unknown, stdout: string, stderr: string) => void) => {
      invocation = [file, args, options];
      callback(Object.assign(new Error("secret stderr"), { code: "ETIMEDOUT", killed: true, signal: "SIGKILL" }), "", "secret stderr");
    }) as never,
  }), VideoProbeInfrastructureError);
  assert.deepEqual((invocation[1] as string[]).slice(0, 6), ["-v", "error", "-print_format", "json", "-show_streams", "-show_format"]);
  assert.equal((invocation[1] as string[]).at(-1), "C:\\temp\\random.media");
  assert.equal((invocation[2] as { shell: boolean }).shell, false);
  assert.equal(typeof (invocation[2] as { timeout: number }).timeout, "number");
});

test("only allowlisted FFprobe decode evidence is definitive media failure", async () => {
  const fake = (stderr: string) => ((_: string, __: string[], ___: object, callback: (error: unknown, stdout: string, stderr: string) => void) => {
    callback(Object.assign(new Error("hidden"), { code: 1, killed: false, signal: null }), "", stderr);
  }) as never;
  await assert.rejects(probeVideo("x.media", { detectContainer: async () => evidence.MP4, execFile: fake("Invalid data found when processing input") }), VideoProbeMediaError);
  await assert.rejects(probeVideo("x.media", { detectContainer: async () => evidence.MP4, execFile: fake("unknown internal crash /secret") }), VideoProbeInfrastructureError);
});
