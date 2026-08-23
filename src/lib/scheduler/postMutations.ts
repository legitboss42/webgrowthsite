import type { ApproveSchedulerPostInput, CreateSchedulerPostInput } from "./store";

type AtomicMutationResult =
  | { ok: true; postId: string; approvalId?: string }
  | { ok: false; code: string };

export type AtomicPostMutationStore = {
  createPost(input: CreateSchedulerPostInput): Promise<unknown>;
  approvePost(input: ApproveSchedulerPostInput): Promise<unknown>;
};

export function isSchedulerPostMutationAction(action: unknown): action is "create" | "approve" {
  return action === "create" || action === "approve";
}

export function classifyApprovalPostRead<T>(result: { data: T | null; error: boolean }) {
  if (result.error) return { ok: false as const, status: 502, error: "Unable to read post." };
  if (!result.data) return { ok: false as const, status: 404, error: "Post not found." };
  return { ok: true as const, data: result.data };
}

export function classifyApprovalMediaRead<T>(result: { data: T[] | null; error: boolean }) {
  if (result.error) return { ok: false as const, status: 502, error: "Unable to read post media." };
  if (!result.data?.length) return { ok: false as const, status: 409, error: "Post media or content changed before approval." };
  return { ok: true as const, data: result.data };
}

function parseAtomicResult(value: unknown): AtomicMutationResult | null {
  if (!value || typeof value !== "object") return null;
  const result = value as Record<string, unknown>;
  if (result.ok === true && typeof result.postId === "string") {
    return {
      ok: true,
      postId: result.postId,
      ...(typeof result.approvalId === "string" ? { approvalId: result.approvalId } : {}),
    };
  }
  if (result.ok === false && typeof result.code === "string") return { ok: false, code: result.code };
  return null;
}

function sanitizedDatabaseError(cause: unknown, fallback: string): string {
  if (cause instanceof Error && /^Scheduler database operation failed \([A-Za-z0-9_]+\)\.$/.test(cause.message)) {
    return cause.message;
  }
  return fallback;
}

export async function createPostAtBoundary(store: AtomicPostMutationStore, input: CreateSchedulerPostInput) {
  try {
    const result = parseAtomicResult(await store.createPost(input));
    if (result?.ok) return { ok: true as const, status: 201, postId: result.postId };
    if (result && !result.ok) {
      if (result.code === "ACCESS_DENIED") return { ok: false as const, status: 403, error: "Active scheduler access and current legal acceptance are required." };
      if (result.code === "MEDIA_OWNERSHIP") return { ok: false as const, status: 403, error: "Media ownership check failed." };
      if (result.code === "INVALID_MEDIA") return { ok: false as const, status: 400, error: "Select valid unmixed media within the scheduler limit." };
    }
    return { ok: false as const, status: 502, error: "Unable to create post." };
  } catch (cause) {
    return { ok: false as const, status: 502, error: sanitizedDatabaseError(cause, "Unable to create post.") };
  }
}

export async function approvePostAtBoundary(store: AtomicPostMutationStore, input: ApproveSchedulerPostInput) {
  try {
    const result = parseAtomicResult(await store.approvePost(input));
    if (result?.ok && result.approvalId) {
      return {
        ok: true as const,
        status: 200,
        postId: result.postId,
        approvalId: result.approvalId,
        fingerprint: input.fingerprint,
      };
    }
    if (result && !result.ok) {
      if (result.code === "ACCESS_DENIED") return { ok: false as const, status: 403, error: "Active scheduler access and current legal acceptance are required." };
      if (result.code === "POST_NOT_FOUND") return { ok: false as const, status: 404, error: "Post not found." };
      if (result.code === "POST_CHANGED") return { ok: false as const, status: 409, error: "Post media or content changed before approval." };
    }
    return { ok: false as const, status: 502, error: "Unable to approve post." };
  } catch (cause) {
    return { ok: false as const, status: 502, error: sanitizedDatabaseError(cause, "Unable to approve post.") };
  }
}
