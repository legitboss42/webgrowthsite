import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["performance-optimisation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/performance-optimisation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
