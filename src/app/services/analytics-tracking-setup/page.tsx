import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["analytics-tracking-setup"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/analytics-tracking-setup"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
