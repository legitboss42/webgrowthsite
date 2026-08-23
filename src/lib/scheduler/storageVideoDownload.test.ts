import assert from "node:assert/strict";
import test from "node:test";
import { downloadStoredVideoStream } from "./storageVideoDownload";

test("stored video download uses the Supabase streaming builder without awaiting a Blob", async () => {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new Uint8Array([1, 2, 3]));
      controller.close();
    },
  });
  let asStreamCalls = 0;
  const bucket = {
    download(path: string) {
      assert.equal(path, "user/asset/upload.media");
      return {
        async asStream() {
          asStreamCalls += 1;
          return { data: stream, error: null };
        },
        then() {
          throw new Error("Blob download builder must not be awaited");
        },
      };
    },
  };

  assert.deepEqual(await downloadStoredVideoStream(bucket, "user/asset/upload.media"), {
    data: stream,
    error: false,
  });
  assert.equal(asStreamCalls, 1);
});

test("stored video streaming download preserves provider failure as a retryable read result", async () => {
  const bucket = {
    download() {
      return {
        async asStream() {
          return { data: null, error: new Error("provider /secret") };
        },
      };
    },
  };
  assert.deepEqual(await downloadStoredVideoStream(bucket, "owned/path"), { data: null, error: true });
});
