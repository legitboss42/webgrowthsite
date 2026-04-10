import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["booking-platform-setup-integration"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/booking-platform-setup-integration"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}
