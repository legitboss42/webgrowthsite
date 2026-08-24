import { cookies } from "next/headers";
import { createSupabaseSchedulerOperations } from "@/lib/scheduler/operations";
import { createSuspendUserHandler } from "../ownerOperationHandlers";

export const POST = createSuspendUserHandler({
  cookies,
  async suspendUser(userId, reason) { return (await createSupabaseSchedulerOperations()).suspendUser(userId, reason); },
});
