export type ComposerFile = {
  name: string;
  type: string;
  size: number;
};

export type MediaPostComposerAdapter<TFile extends ComposerFile = ComposerFile> = {
  uploadFile(file: TFile): Promise<string>;
  createPost(input: { mediaIds: string[]; title: string; caption: string }): Promise<{ postId: string }>;
};

export async function runMediaPostComposer<TFile extends ComposerFile>(
  input: { files: TFile[]; title: string; caption: string },
  adapter: MediaPostComposerAdapter<TFile>,
) {
  const files = input.files.filter((file) => file.size > 0);
  if (!files.length) throw new Error("Choose a video or one or more photos.");
  if (files.length > 10) throw new Error("Select no more than 10 media files.");
  const kinds = new Set(files.map((file) => file.type.startsWith("video/") ? "VIDEO" : "PHOTO"));
  if (kinds.size > 1 || (kinds.has("VIDEO") && files.length !== 1)) {
    throw new Error("Choose either one video or up to 10 photos.");
  }

  const mediaIds: string[] = [];
  for (const file of files) {
    try {
      mediaIds.push(await adapter.uploadFile(file));
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : "Upload failed.";
      throw new Error(`Unable to upload ${file.name}: ${reason}`);
    }
  }

  return adapter.createPost({ mediaIds, title: input.title, caption: input.caption });
}
