import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getWhatsAppWorkspaceAccess } from "../auth";
import WorkspaceAdminPanel from "./WorkspaceAdminPanel";

export default async function WhatsAppWorkspacesPage() {
  const access = await getWhatsAppWorkspaceAccess(await cookies());
  if (!access) redirect("/admin/whatsapp/");
  if (!access.platformAdmin) redirect("/admin/whatsapp/");
  return <WorkspaceAdminPanel />;
}
