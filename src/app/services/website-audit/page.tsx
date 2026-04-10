import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["website-audit"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/website-audit"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
