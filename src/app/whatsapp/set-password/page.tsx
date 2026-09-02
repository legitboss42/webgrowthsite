import type { Metadata } from "next";
import PasswordSetupForm from "./PasswordSetupForm";
import { getWorkspacePasswordPublicConfig } from "@/lib/whatsapp/passwordAuth";

export const metadata: Metadata = {
  title: "Set Workspace Password | Web Growth",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function WhatsAppPasswordSetupPage() {
  const config = getWorkspacePasswordPublicConfig();
  return <PasswordSetupForm supabaseUrl={config.url} anonKey={config.anonKey} />;
}
