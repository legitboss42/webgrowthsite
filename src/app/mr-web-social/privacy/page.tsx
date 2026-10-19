import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mr Web Social — Privacy Policy | Web Growth",
  description:
    "How Mr Web Social processes connected Facebook Page and Instagram professional-account data for Web Growth and NOUNCompass.",
  alternates: { canonical: "https://webgrowth.info/mr-web-social/privacy" },
  robots: { index: true, follow: true },
};

const updated = "19 October 2026";

export default function MrWebSocialPrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-slate-900 dark:text-slate-100">
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <p className="text-sm font-semibold uppercase tracking-wider">Mr Web Social</p>
        <h1>Privacy Policy for Mr Web Social</h1>
        <p className="text-sm">Last updated: {updated}</p>
        <p>
          This notice explains how the Mr Web Social integration handles information
          obtained through Meta when managing authorized Facebook Pages and Instagram
          professional accounts. It covers connections for Web Growth and NOUNCompass,
          and any other business account deliberately connected to the same integration.
          It supplements, rather than replaces, each business&apos;s website privacy notice.
        </p>
        <h2>Information handled</h2>
        <p>
          After a person with appropriate authority chooses to connect an account,
          the integration may receive Meta-provided Page and Instagram account
          identifiers, display names, professional account metadata, granted permission
          scopes, OAuth connection status, publishing requests, post and media identifiers,
          publishing outcomes, and related diagnostic information. It may also process
          the content and media links supplied for authorized posts. The integration
          should not request personal Facebook passwords or unrelated private messages.
        </p>
        <h2>Purposes and legal responsibility</h2>
        <p>
          This information is used only to establish and verify authorized connections,
          keep each social account attached to the right business, prepare and execute
          permitted publishing operations, confirm delivery, detect errors, prevent
          duplicate posting, and maintain security and accountability records.
          The responsible business operator should ensure it has an appropriate basis
          and authority for connecting and managing each account.
        </p>
        <h2>Business separation and access</h2>
        <p>
          A Web Growth connection is not a NOUNCompass connection. Authorized agents
          and administrators receive only the capabilities granted for the exact business,
          account, resource, and operation. Account connection alone does not permit
          publication. Access is limited to approved operators and service providers
          needed to deliver the requested integration.
        </p>
        <h2>Tokens and security</h2>
        <p>
          Connection tokens are intended to be kept in restricted secret storage and
          used solely for the authorized Meta API operation. They are not intended
          to appear in public code, content, reports, or agent prompts. Operational
          records may include identifiers and sanitized action details needed to
          investigate failed or unauthorized requests.
        </p>
        <h2>Sharing</h2>
        <p>
          Information may be exchanged with Meta to perform permitted API requests,
          and with the hosting, database, and security services necessary to operate
          the integration. We do not sell information obtained through Meta. We do
          not use connected-account data to access or publish to unrelated businesses.
        </p>
        <h2>Retention, disconnection, and deletion</h2>
        <p>
          Connection details are retained only while required for the authorized
          integration and any necessary security, audit, or legal obligations.
          An authorized person may request account disconnection, access to their
          integration-related personal information, correction, or deletion. We will
          verify the requester&apos;s authority, revoke or remove relevant stored
          credentials and connection records as appropriate, and explain any
          information that must be retained for a legally required period.
          Disconnecting this integration does not automatically delete content
          already published on Meta platforms; the connected business can manage
          that content through the relevant platform.
        </p>
        <h2>Contact and requests</h2>
        <p>
          For requests about the Mr Web Social integration, including access,
          disconnection, or deletion, email{" "}
          <a href="mailto:admin@webgrowth.info">admin@webgrowth.info</a>.
          For NOUNCompass-specific information, you may also contact{" "}
          <a href="mailto:support@nouncompass.me">support@nouncompass.me</a>.
          Please identify the business and connected account in your request, but do
          not email passwords, access tokens, or sensitive credentials.
        </p>
        <h2>Updates</h2>
        <p>
          This policy may be updated when the integration, its processing practices,
          or applicable legal requirements change. Material changes will be recorded
          before newly affected processing begins.
        </p>
        <p>
          Related notices:{" "}
          <a href="/privacy">Web Growth Privacy Policy</a>
          {" · "}
          <a href="https://nouncompass.me/privacy-policy">
            NOUNCompass Privacy Policy
          </a>
        </p>
      </article>
    </main>
  );
}
