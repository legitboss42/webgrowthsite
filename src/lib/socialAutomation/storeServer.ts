import "server-only";

import { createSchedulerSupabaseClient } from "@/lib/scheduler/supabase";
import { createSocialAutomationStoreFromClient } from "./store";

export function createSocialAutomationStore() {
  return createSocialAutomationStoreFromClient(createSchedulerSupabaseClient());
}
