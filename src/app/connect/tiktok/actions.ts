"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createInternalWorkflowCookieValue,
  getInternalWorkflowCookieName,
  getInternalWorkflowTtlSeconds,
  isInternalWorkflowConfigured,
  verifyInternalWorkflowPassphrase,
} from "@/lib/internalWorkflowAuth";
import {
  getTikTokConnectionCookieName,
  getTikTokTokenCookieName,
} from "@/lib/tiktok";

const CONNECT_PATH = "/connect/tiktok/";

function secureCookieFlag() {
  return process.env.NODE_ENV === "production";
}

export async function unlockInternalWorkflow(formData: FormData) {
  const passphrase = String(formData.get("passphrase") || "");

  if (!isInternalWorkflowConfigured()) {
    redirect(`${CONNECT_PATH}?workflow=config-missing`);
  }

  if (!verifyInternalWorkflowPassphrase(passphrase)) {
    redirect(`${CONNECT_PATH}?workflow=invalid`);
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: getInternalWorkflowCookieName(),
    value: createInternalWorkflowCookieValue(),
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookieFlag(),
    path: "/",
    maxAge: getInternalWorkflowTtlSeconds(),
  });

  redirect(`${CONNECT_PATH}?workflow=ready`);
}

export async function lockInternalWorkflow() {
  const cookieStore = await cookies();
  cookieStore.delete(getInternalWorkflowCookieName());
  redirect(`${CONNECT_PATH}?workflow=locked`);
}

export async function clearTikTokConnection() {
  const cookieStore = await cookies();
  cookieStore.delete(getTikTokConnectionCookieName());
  cookieStore.delete(getTikTokTokenCookieName());
  redirect(`${CONNECT_PATH}?status=cleared`);
}
