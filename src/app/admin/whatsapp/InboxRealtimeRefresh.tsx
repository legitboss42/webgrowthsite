"use client";

import { useRouter } from "next/navigation";
import { useWhatsAppRealtime } from "@/components/whatsapp/WhatsAppRealtimeProvider";

export default function InboxRealtimeRefresh() {
  const router = useRouter();
  useWhatsAppRealtime("inbox", () => router.refresh());
  return null;
}
