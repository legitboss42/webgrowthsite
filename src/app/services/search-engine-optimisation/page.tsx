import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["search-engine-optimisation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/search-engine-optimisation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}