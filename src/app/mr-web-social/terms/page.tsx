import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mr Web Social — Terms of Use | Web Growth",
  description: "Terms for authorized business use of the Mr Web Social Facebook Page and Instagram professional-account integration.",
  alternates: { canonical: "https://webgrowth.info/mr-web-social/terms" },
  robots: { index: true, follow: true },
};

export default function MrWebSocialTermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-slate-900 dark:text-slate-100">
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <p className="text-sm font-semibold uppercase tracking-wider">Mr Web Social</p>
        <h1>Terms of Use</h1>
        <p className="text-sm">Last updated: 19 October 2026</p>
        <p>
          These terms apply to the Mr Web Social integration operated by Web Growth for the authorized
          Facebook Pages and Instagram professional accounts of Web Growth, NOUNCompass, and
          other businesses that are expressly onboarded. They apply to the integration,
          not to unrelated Web Growth website-development services.
        </p>
        <h2>Who may connect an account</h2>
        <p>
          Only a person authorized to manage the relevant business account may connect it.
          You are responsible for ensuring your use of the account and supplied content
          complies with applicable law, intellectual-property rights, Meta&apos;s platform
          policies, and your own business obligations.
        </p>
        <h2>Permitted functions</h2>
        <p>
          Depending on the features and permissions enabled, the integration can verify connected
          account identity, prepare social-media content, and manage specifically authorized
          publishing requests. Connection does not automatically grant permission to publish.
          Publishing, scheduling, and other external changes are subject to the applicable
          business approval and access controls. Features not yet activated are not promised.
        </p>
        <h2>Account access and disconnection</h2>
        <p>
          You can withdraw Meta authorization through the relevant Facebook or Instagram
          account settings. You may also request removal of an integration connection
          by contacting support. Revocation may interrupt queued or future authorized
          activity. We do not ask you to disclose a Meta password or access token.
        </p>
        <h2>Content and service limitations</h2>
        <p>
          You must have the rights to content you ask us to process or publish. We may
          decline or suspend actions that are unauthorized, unsafe, deceptive, or inconsistent
          with platform rules. Meta controls platform availability, access privileges,
          content moderation, API limits, and publishing eligibility; delivery and reach
          cannot be guaranteed.
        </p>
        <h2>Changes and service availability</h2>
        <p>
          Features may change as security requirements, provider rules, or authorized
          business workflows change. Material changes to these terms will be reflected
          here with an updated date. Please contact us before relying on an unavailable
          feature or submitting time-sensitive content.
        </p>
        <h2>Contact and related information</h2>
        <p>
          For questions or requests, email{" "}
          <a href="mailto:admin@webgrowth.info">admin@webgrowth.info</a>.
          NOUNCompass-related questions can also be sent to{" "}
          <a href="mailto:support@nouncompass.me">support@nouncompass.me</a>.
        </p>
        <p>
          <Link href="/mr-web-social/privacy">Privacy Policy</Link>{" · "}
          <Link href="/mr-web-social/data-deletion">Data Deletion</Link>{" · "}
          <Link href="/mr-web-social/support">Support</Link>
        </p>
      </article>
    </main>
  );
}
