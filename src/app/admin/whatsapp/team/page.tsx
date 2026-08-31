import type { Metadata } from "next";
import { cookies } from "next/headers";
import TeamSettingsPanel from "../TeamSettingsPanel";
import { getWhatsAppWorkspaceAccess } from "../auth";
import { canWhatsAppRoleSuperviseTeam } from "@/lib/whatsapp/teamModel";

export const metadata: Metadata = {
  title: "WhatsApp Team | Web Growth",
  robots: { index: false, follow: false },
};

export default async function WhatsAppTeamPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || !canWhatsAppRoleSuperviseTeam(access.role)) {
    return (
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
          Manager or Owner access is required to manage the team.
        </div>
      </div>
    );
  }

  return <TeamSettingsPanel viewerRole={access.role} />;
}
