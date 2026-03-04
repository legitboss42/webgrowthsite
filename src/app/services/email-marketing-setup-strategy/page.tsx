import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["email-marketing-setup-strategy"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/email-marketing-setup-strategy"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}