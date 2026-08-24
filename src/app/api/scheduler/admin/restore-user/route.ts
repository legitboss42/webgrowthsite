import { cookies } from "next/headers";
import { createSupabaseSchedulerOperations } from "@/lib/scheduler/operations";
import { createRestoreUserHandler } from "../ownerOperationHandlers";

export const POST = createRestoreUserHandler({
  cookies,
  async restoreUser(userId) { return (await createSupabaseSchedulerOperations()).restoreUser(userId); },
});
