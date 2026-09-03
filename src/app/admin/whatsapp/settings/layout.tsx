import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { loadWhatsAppQuickSettings } from "@/lib/whatsapp/quickSettings";
import { loadWhatsAppSettings } from "@/lib/whatsapp/settingsStore";
import { getWhatsAppWorkspaceAccess } from "../auth";
import QuickSettingsPanel from "../QuickSettingsPanel";
import CallingSettingsPanel from "../CallingSettingsPanel";
import MessageVisibilitySettingsPanel from "../MessageVisibilitySettingsPanel";
import TeamSettingsPanel from "../TeamSettingsPanel";

export default async function WhatsAppSettingsLayout({ children }: { children: ReactNode }) {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access || access.role !== "owner") {
    return (
      <div className="px-4 py-12 sm:px-6">
        <div className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 px-5 py-6 text-sm text-rose-800">
          Workspace Owner access is required for WhatsApp integration settings.
        </div>
      </div>
    );
  }

  const [{ settings }, quickSettings] = await Promise.all([
    loadWhatsAppSettings({ maxAgeMs: 0, workspaceId: access.workspaceId }),
    loadWhatsAppQuickSettings({ workspaceId: access.workspaceId }),
  ]);

  return (
    <div className="wg-settings-workspace whatsapp-settings-tabs-root">
      <style>{`
        .whatsapp-settings-tabs-root #business,
        .whatsapp-settings-tabs-root #messaging,
        .whatsapp-settings-tabs-root #ai-automation,
        .whatsapp-settings-tabs-root #connection,
        .whatsapp-settings-tabs-root #advanced {
          display: none;
          margin-top: 0;
        }

        .whatsapp-settings-tabs-root #business {
          display: block;
        }

        .whatsapp-settings-tabs-root:has(#messaging:target) #business,
        .whatsapp-settings-tabs-root:has(#ai-automation:target) #business,
        .whatsapp-settings-tabs-root:has(#connection:target) #business,
        .whatsapp-settings-tabs-root:has(#advanced:target) #business {
          display: none;
        }

        .whatsapp-settings-tabs-root #business:target,
        .whatsapp-settings-tabs-root #messaging:target,
        .whatsapp-settings-tabs-root #ai-automation:target,
        .whatsapp-settings-tabs-root #connection:target,
        .whatsapp-settings-tabs-root #advanced:target {
          display: block;
        }

        .whatsapp-settings-messaging-extra,
        .whatsapp-settings-advanced-extra {
          display: none;
        }

        .whatsapp-settings-tabs-root:has(#messaging:target) .whatsapp-settings-messaging-extra,
        .whatsapp-settings-tabs-root:has(#advanced:target) .whatsapp-settings-advanced-extra {
          display: block;
        }

        .whatsapp-settings-tabs-root nav:has(a[href="#business"]) {
          display: flex;
          flex-wrap: nowrap;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .whatsapp-settings-tabs-root nav:has(a[href="#business"])::-webkit-scrollbar {
          display: none;
        }

        .whatsapp-settings-tabs-root nav:has(a[href="#business"]) a {
          flex: none;
          white-space: nowrap;
          transition: background-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }

        .whatsapp-settings-tabs-root nav a[href="#business"] {
          background: rgba(18, 74, 56, 0.09);
          box-shadow: inset 0 0 0 1px rgba(18, 74, 56, 0.14);
        }

        .whatsapp-settings-tabs-root:has(#messaging:target) nav a[href="#business"],
        .whatsapp-settings-tabs-root:has(#ai-automation:target) nav a[href="#business"],
        .whatsapp-settings-tabs-root:has(#connection:target) nav a[href="#business"],
        .whatsapp-settings-tabs-root:has(#advanced:target) nav a[href="#business"] {
          background: transparent;
          box-shadow: none;
        }

        .whatsapp-settings-tabs-root:has(#business:target) nav a[href="#business"],
        .whatsapp-settings-tabs-root:has(#messaging:target) nav a[href="#messaging"],
        .whatsapp-settings-tabs-root:has(#ai-automation:target) nav a[href="#ai-automation"],
        .whatsapp-settings-tabs-root:has(#connection:target) nav a[href="#connection"],
        .whatsapp-settings-tabs-root:has(#advanced:target) nav a[href="#advanced"] {
          background: rgba(18, 74, 56, 0.09);
          box-shadow: inset 0 0 0 1px rgba(18, 74, 56, 0.14);
        }

        .whatsapp-settings-messaging-extra,
        .whatsapp-settings-advanced-extra {
          margin: 1.25rem auto 0;
          max-width: 72rem;
        }
      `}</style>

      {children}

      <div className="whatsapp-settings-messaging-extra" aria-label="Messaging settings">
        <QuickSettingsPanel settings={settings} quickSettings={quickSettings} />
        <MessageVisibilitySettingsPanel quickSettings={quickSettings} />
        <CallingSettingsPanel businessHours={settings.businessHours} />
      </div>

      <div className="whatsapp-settings-advanced-extra" aria-label="Team and access settings">
        <TeamSettingsPanel viewerRole={access.role} />
      </div>
    </div>
  );
}
