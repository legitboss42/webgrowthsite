import { POST as workspaceLogoutPOST } from "../workspace/logout/route";

export const runtime = "nodejs";

export async function POST(request: Request) {
  return workspaceLogoutPOST(request);
}
