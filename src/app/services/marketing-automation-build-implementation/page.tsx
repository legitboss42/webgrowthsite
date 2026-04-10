import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["marketing-automation-build-implementation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/marketing-automation-build-implementation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
