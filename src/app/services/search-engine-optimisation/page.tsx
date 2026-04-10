import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["search-engine-optimisation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/search-engine-optimisation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
