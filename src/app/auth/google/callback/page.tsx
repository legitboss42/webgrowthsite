import type { Metadata } from "next";
import GoogleAuthCallback from "@/components/auth/GoogleAuthCallback";

export const metadata: Metadata = {
  title: "Google Sign-In | Web Growth",
  robots: { index: false, follow: false },
};

export default function GoogleAuthCallbackPage() {
  return <GoogleAuthCallback />;
}
