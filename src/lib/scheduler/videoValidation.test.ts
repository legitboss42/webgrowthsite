import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";
import { probeStoredVideo, validateTikTokVideo, type VideoProbe } from "./videoValidation";

type ProbeFixtureFile = {
  passingMp4: VideoProbe;
  cases: Array<{
    name: string;
    override: Partial<VideoProbe>;
    error: string;
  }>;
};

const fixtures = JSON.parse(readFileSync(
  new URL("./fixtures/videoProbeFixtures.json", import.meta.url),
  "utf8",
)) as ProbeFixtureFile;

// Mutation target: trusting browser MIME/metadata instead of the stored-object probe must not admit an unprobed video.
test("stored MP4 H.264 at 1080 by 1920 and 30 FPS passes beta validation", () => {
  assert.deepEqual(validateTikTokVideo(fixtures.passingMp4, 500 * 1024 * 1024, 60), { ok: true });
});

for (const fixture of fixtures.cases) {
  // Mutation target: removing or widening one exact beta bound must allow this invalid probe.
  test(`${fixture.name} fails with the exact video policy message`, () => {
    const result = validateTikTokVideo({ ...fixtures.passingMp4, ...fixture.override }, 1024, 60);
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.error, fixture.error);
  });
}

// Mutation target: omitting the current creator maximum must accept a video TikTok will reject for that creator.
test("duration above the creator maximum fails with the exact message", () => {
  const result = validateTikTokVideo({ ...fixtures.passingMp4, durationSeconds: 61 }, 1024, 60);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Video duration exceeds the allowed maximum.");
});

// Mutation target: using a decimal or 500,000,000-byte cap must reject the binary 500 MB boundary or admit one byte over it.
test("video size accepts exactly 500 MB and rejects one byte more", () => {
  assert.equal(validateTikTokVideo(fixtures.passingMp4, 500 * 1024 * 1024, 60).ok, true);
  const result = validateTikTokVideo(fixtures.passingMp4, 500 * 1024 * 1024 + 1, 60);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Video size must not exceed 500 MB.");
});

// Mutation target: accepting a demuxable non-MP4 container must let WebM pass the MP4-only beta.
test("unsupported container fails with the exact message", () => {
  const result = validateTikTokVideo({ ...fixtures.passingMp4, formatName: "matroska,webm" }, 1024, 60);
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Video must use the MP4 container.");
});

// Mutation target: removing finally cleanup must leave the authenticated user's validation copy on disk after probe failure.
test("stored-video probing removes its temporary copy when probing fails", async () => {
  let temporaryPath = "";
  await assert.rejects(
    probeStoredVideo(new Uint8Array([1, 2, 3]), {
      async probe(path) {
        temporaryPath = path;
        assert.equal(existsSync(path), true);
        throw new Error("fixture probe failure");
      },
    }),
    /fixture probe failure/,
  );
  assert.notEqual(temporaryPath, "");
  assert.equal(existsSync(temporaryPath), false);
});
