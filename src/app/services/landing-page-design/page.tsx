import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["landing-page-design"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/landing-page-design"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
