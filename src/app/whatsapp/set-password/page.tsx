import type { Metadata } from "next";
import PasswordSetupForm from "./PasswordSetupForm";
import { getWorkspacePasswordPublicConfig } from "@/lib/whatsapp/passwordAuth";

export const metadata: Metadata = {
  title: "Set Workspace Password | Web Growth",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function WhatsAppPasswordSetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token_hash?: string; type?: string }>;
}) {
  const config = getWorkspacePasswordPublicConfig();
  const params = await searchParams;
  const tokenType = params.type === "invite" || params.type === "recovery" ? params.type : "";

  return (
    <PasswordSetupForm
      supabaseUrl={config.url}
      anonKey={config.anonKey}
      tokenHash={params.token_hash?.trim() || ""}
      tokenType={tokenType}
    />
  );
}
