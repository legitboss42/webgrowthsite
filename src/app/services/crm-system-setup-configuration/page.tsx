import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["crm-system-setup-configuration"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/crm-system-setup-configuration"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}