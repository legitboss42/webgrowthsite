import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["google-my-business-setup-optimisation"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/google-my-business-setup-optimisation"
);

export default function Page() {
  return <ServiceDetailTemplateClient service={service} />;
}