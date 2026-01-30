import type { Metadata } from "next";
import ServicesClient from "@/components/ServicesClient";
import { sanityClient } from "@/sanity/lib/client";
import { SERVICES_QUERY } from "@/sanity/lib/queries";

export const metadata: Metadata = {
  title: "Services | Web Growth",
  description:
    "Explore Web Growth services: business websites, landing pages, redesign, e-commerce, maintenance, performance optimisation, and website audits.",
  alternates: { canonical: "https://webgrowth.info/services" },
  robots: { index: true, follow: true },
};

export default async function Page() {
  const services = await sanityClient.fetch(
    SERVICES_QUERY,
    {},
    { next: { revalidate: 60 } }
  );

  return <ServicesClient services={services ?? []} />;
}