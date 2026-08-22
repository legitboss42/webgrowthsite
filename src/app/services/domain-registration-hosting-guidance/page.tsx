import ServiceDetailTemplateClient from "@/components/ServiceDetailTemplateClient";
import HostingSupportBlock from "@/components/HostingSupportBlock";
import { ALL_SERVICE_PAGES, buildServiceMetadata } from "@/lib/newServiceConfigs";

const service = ALL_SERVICE_PAGES["domain-registration-hosting-guidance"];

export const metadata = buildServiceMetadata(
  service,
  "https://webgrowth.info/services/domain-registration-hosting-guidance"
);

export default function Page() {
  return (
    <>
      <ServiceDetailTemplateClient service={service} />
      <div className="bg-[#eff1ec] pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <HostingSupportBlock
            title="Need help choosing the right hosting and domain setup?"
            description="Use this support block when you want clearer guidance on hosting, ownership, launch readiness, and the right implementation path."
            ctaLabel="Review pricing guidance"
          />
        </div>
      </div>
    </>
  );
}
