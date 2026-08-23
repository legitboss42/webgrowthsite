type StreamDownloadResult = {
  data: ReadableStream<Uint8Array> | null;
  error: unknown;
};

export type StreamingStorageBucket = {
  download(path: string): {
    asStream(): PromiseLike<StreamDownloadResult>;
  };
};

export async function downloadStoredVideoStream(bucket: StreamingStorageBucket, storagePath: string) {
  const { data, error } = await bucket.download(storagePath).asStream();
  return { data, error: !!error };
}
