import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import HostingSupportBlock from "@/components/HostingSupportBlock";
import { NEW_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = NEW_SERVICE_PAGES["domain-registration-hosting-guidance"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/domain-registration-hosting-guidance"
);

export default function Page() {
  return (
    <>
      <ServiceDetailTemplateClient service={service} />
      <div className="bg-black pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <HostingSupportBlock
            title="Need hosting support before the website goes live?"
            description="The hosting offer gives you a lower-cost starting point for getting online, with a direct path into the website launch service when you are ready."
            ctaLabel="View Hosting Offer"
          />
        </div>
      </div>
    </>
  );
}
