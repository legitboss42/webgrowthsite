import { Suspense } from "react";
import GetStartedClient from "@/components/GetStartedClient";
import StructuredData from "@/components/StructuredData";
import { buildPageMetadata, buildProfessionalServiceSchema } from "@/lib/seo";

const pageDescription =
  "Get started with a 48-hour website launch using a simple multi-step intake flow, then choose to book a call or continue on WhatsApp.";

export const metadata = buildPageMetadata({
  title: "Get Started | Website Design in 48 Hours",
  description: pageDescription,
  path: "/get-started",
  noIndex: true,
  keywords: [
    "website design in 48 hours",
    "get started website launch",
    "website project intake form",
    "book website launch call",
  ],
});

export default function GetStartedPage() {
  return (
    <>
      <StructuredData
        data={buildProfessionalServiceSchema("/get-started", pageDescription)}
      />
      <main className="bg-[#050806] text-white">
        <Suspense
          fallback={
            <section className="border-b border-white/10 py-20">
              <div className="mx-auto max-w-3xl px-6">
                <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-white/70">
                  Loading get started flow...
                </div>
              </div>
            </section>
          }
        >
          <GetStartedClient />
        </Suspense>
      </main>
    </>
  );
}
