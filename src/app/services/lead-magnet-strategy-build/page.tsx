import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["lead-magnet-strategy-build"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/lead-magnet-strategy-build"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}