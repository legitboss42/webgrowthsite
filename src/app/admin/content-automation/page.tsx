import type { Metadata } from "next";
import { cookies } from "next/headers";

import GoogleAdminPrompt from "@/components/auth/GoogleAdminPrompt";
import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import {
  getDefaultAdminGoogleEmail,
  getGoogleClientId,
  isGoogleAuthConfigured,
} from "@/lib/googleAuth";
import { isMetaConnectionUsable } from "@/lib/socialAutomation/adminModel";
import { createSocialAutomationStore } from "@/lib/socialAutomation/storeServer";
import { hasContentAutomationAdminAccess } from "./auth";
import ContentAutomationClient, { type ContentAutomationJob } from "./ContentAutomationClient";

export const metadata: Metadata = {
  title: "Content Automation | Web Growth",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function text(value: unknown) {
  return typeof value === "string" ? value : "";
}

async function loadDashboardData() {
  const store = createSocialAutomationStore();
  const supabase = createSchedulerSupabaseClient();

  const [settingsRow, connection, jobs] = await Promise.all([
    store.getSettings(),
    store.getConnectionSummary("META"),
    store.listRecentJobs(30),
  ]);

  const jobIds = jobs.map((job) => String(job.id)).filter(Boolean);
  let publicationRows: Record<string, unknown>[] = [];
  if (jobIds.length > 0) {
    const { data, error } = await supabase
      .from("social_publications")
      .select("job_id,platform,status,external_publication_id,external_url,last_error_message")
      .in("job_id", jobIds);
    if (error) throw new Error(`Unable to load social publications: ${error.message}`);
    publicationRows = (data ?? []) as Record<string, unknown>[];
  }

  const publicationsByJob = new Map<string, Record<string, unknown>[]>();
  for (const publication of publicationRows) {
    const jobId = text(publication.job_id);
    if (!jobId) continue;
    const rows = publicationsByJob.get(jobId) ?? [];
    rows.push(publication);
    publicationsByJob.set(jobId, rows);
  }

  const dashboardJobs: ContentAutomationJob[] = jobs.map((job) => {
    const snapshot = record(job.article_snapshot);
    const article = record(snapshot?.article);
    const id = String(job.id);
    return {
      id,
      articleSlug: text(job.article_slug),
      articleTitle: text(article?.title) || text(job.article_slug) || "Untitled article",
      status: text(job.status) || "QUEUED",
      createdAt: text(job.created_at),
      publications: (publicationsByJob.get(id) ?? []).map((publication) => ({
        platform: text(publication.platform) as "INSTAGRAM" | "FACEBOOK" | "TIKTOK",
        status: text(publication.status),
        externalPublicationId: text(publication.external_publication_id) || null,
        externalUrl: text(publication.external_url) || null,
        lastErrorMessage: text(publication.last_error_message) || null,
      })),
    };
  });

  return {
    settings: {
      enabled: settingsRow.enabled === true,
      instagramEnabled: settingsRow.instagram_enabled === true,
      facebookEnabled: settingsRow.facebook_enabled === true,
      tiktokGenerationEnabled: settingsRow.tiktok_generation_enabled === true,
      assetRetentionDays: Number(settingsRow.asset_retention_days) || 7,
    },
    connection: {
      connected: Boolean(connection),
      usable: isMetaConnectionUsable(connection ? {
        reconnectRequired: connection.reconnectRequired,
        accessExpiresAt: connection.accessExpiresAt,
      } : null),
      facebookPageName: connection?.facebookPageName ?? null,
      instagramAccountName: connection?.instagramAccountName ?? null,
      accessExpiresAt: connection?.accessExpiresAt ?? null,
    },
    jobs: dashboardJobs,
  };
}

export default async function ContentAutomationAdminPage() {
  const cookieStore = await cookies();
  if (!(await hasContentAutomationAdminAccess(cookieStore))) {
    return (
      <main className="min-h-screen bg-[#050806] px-6 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <GoogleAdminPrompt
            nextPath="/admin/content-automation/"
            adminEmail={getDefaultAdminGoogleEmail()}
            clientId={getGoogleClientId()}
            googleReady={isGoogleAuthConfigured()}
          />
        </div>
      </main>
    );
  }

  let data: Awaited<ReturnType<typeof loadDashboardData>> | null = null;
  let loadFailed = false;
  try {
    data = await loadDashboardData();
  } catch (error) {
    loadFailed = true;
    console.error("[social-automation] dashboard load failed", {
      message: error instanceof Error ? error.message : "unknown error",
    });
  }

  return (
    <main className="min-h-screen bg-[#050806] px-5 py-10 text-white sm:px-7">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-300">Internal automation</p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight">Content Automation</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/55">
              Convert newly published Web Growth blog posts into platform-specific vertical video, publish Meta automatically, and prepare TikTok for its required consent step.
            </p>
          </div>
        </div>

        {loadFailed || !data ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/5 p-6 text-sm text-amber-100/80">
            Content automation storage is not ready in this environment yet. The production migration remains intentionally unapplied until deployment approval.
          </div>
        ) : (
          <ContentAutomationClient
            initialSettings={data.settings}
            connection={data.connection}
            jobs={data.jobs}
          />
        )}
      </div>
    </main>
  );
}
