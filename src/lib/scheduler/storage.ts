import { buildStagingObjectPath } from "./media";

export type MediaStorageClient = {
  copy(fromBucket: string, fromPath: string, toBucket: string, toPath: string): Promise<void>;
  remove(bucket: string, paths: string[]): Promise<void>;
};

export function createMediaStorage(client: MediaStorageClient) {
  return {
    async stage(attemptId: string, privatePath: string, filename: string, randomId?: () => string) {
      const stagingPath = buildStagingObjectPath(attemptId, filename, randomId);
      await client.copy("tiktok-scheduler-media", privatePath, "tiktok-publishing-staging", stagingPath);
      return { stagingPath, publicPath: `/tiktok-media/${stagingPath}` };
    },
    removeStaged(paths: string[]) {
      return client.remove("tiktok-publishing-staging", paths);
    },
  };
}

export async function createSupabaseMediaStorage() {
  const { createSchedulerSupabaseClient } = await import("./supabase");
  const supabase = createSchedulerSupabaseClient();
  return createMediaStorage({
    async copy(fromBucket, fromPath, toBucket, toPath) {
      const { error } = await supabase.storage.from(fromBucket).copy(fromPath, toPath, { destinationBucket: toBucket });
      if (error) throw new Error(`Scheduler media staging failed (${error.name}).`);
    },
    async remove(bucket, paths) {
      if (!paths.length) return;
      const { error } = await supabase.storage.from(bucket).remove(paths);
      if (error) throw new Error(`Scheduler media cleanup failed (${error.name}).`);
    },
  });
}
