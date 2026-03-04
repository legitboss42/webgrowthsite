import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["domain-registration-hosting-guidance"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/domain-registration-hosting-guidance"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}