import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["marketing-automation-build-implementation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/marketing-automation-build-implementation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}