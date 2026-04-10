import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["email-marketing-setup-strategy"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/email-marketing-setup-strategy"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
