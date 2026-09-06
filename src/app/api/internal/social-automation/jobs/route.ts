import { NextResponse } from "next/server";

import { getPost, isPublicBlogSlug } from "@/lib/posts";
import { normalizeSocialArticle } from "@/lib/socialAutomation/article";
import { readSignedJsonRequest } from "@/lib/socialAutomation/internalRequestServer";
import { buildSocialAutomationJobSeed } from "@/lib/socialAutomation/jobSeed";
import { parseCreateJobRequest } from "@/lib/socialAutomation/requestModel";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const signed = await readSignedJsonRequest(request);
  if (!signed.ok) {
    return NextResponse.json({ ok: false, code: signed.code }, { status: signed.status });
  }

  const input = parseCreateJobRequest(signed.body);
  if (!input) {
    return NextResponse.json({ ok: false, code: "INVALID_JOB_REQUEST" }, { status: 400 });
  }

  const post = getPost(input.slug);
  if (!post) {
    return NextResponse.json(
      { ok: false, code: "ARTICLE_NOT_AVAILABLE", retryable: true },
      { status: 425 }
    );
  }
  if (!isPublicBlogSlug(input.slug)) {
    return NextResponse.json({ ok: false, code: "ARTICLE_NOT_PUBLISHABLE" }, { status: 422 });
  }

  const article = normalizeSocialArticle(post);
  const seed = buildSocialAutomationJobSeed(
    article,
    input.sourceCommitSha,
    input.automationVersion
  );
  const store = createSocialAutomationStore();
  const job = await store.createJob({
    articleSlug: article.slug,
    sourceCommitSha: input.sourceCommitSha,
    automationVersion: input.automationVersion,
    idempotencyKey: seed.idempotencyKey,
    articleSnapshot: seed.articleSnapshot,
  });
  const jobId = String(job.id);

  for (const publication of seed.publications) {
    await store.upsertPublication({
      jobId,
      platform: publication.platform,
      caption: publication.caption,
      status: publication.status,
    });
  }
  await store.updateJob(jobId, { status: "RENDERING" });
  await store.audit({
    jobId,
    eventType: "JOB_CREATED",
    metadata: { articleSlug: article.slug, sourceCommitSha: input.sourceCommitSha },
  });

  return NextResponse.json({
    ok: true,
    jobId,
    idempotencyKey: seed.idempotencyKey,
    status: "RENDERING",
  });
}
