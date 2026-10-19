import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mr Web Social — Data Deletion Instructions | Web Growth",
  description: "How to disconnect Mr Web Social and request deletion of Facebook Page or Instagram integration-related information.",
  alternates: { canonical: "https://webgrowth.info/mr-web-social/data-deletion" },
  robots: { index: true, follow: true },
};

export default function MrWebSocialDeletionPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-slate-900 dark:text-slate-100">
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <p className="text-sm font-semibold uppercase tracking-wider">Mr Web Social</p>
        <h1>Data Deletion Instructions</h1>
        <p className="text-sm">Last updated: 19 October 2026</p>
        <p>
          This page explains how an authorized account holder can disconnect the
          Mr Web Social integration or request removal of information associated
          with a connected Facebook Page or Instagram professional account.
          The instructions apply to Web Growth, NOUNCompass, and other expressly
          connected businesses.
        </p>
        <h2>Step 1: Remove app access, if desired</h2>
        <p>
          In Facebook, open Settings &amp; privacy, then Settings and Apps and Websites,
          locate Mr Web Social, and use the available removal option. Meta may also
          offer a data-deletion request when you remove an app. Account owners may
          manage connected app access through their relevant Meta business settings.
          These controls are provided by Meta and may change over time.
        </p>
        <h2>Step 2: Send your deletion request</h2>
        <p>
          Email <a href="mailto:admin@webgrowth.info?subject=Mr%20Web%20Social%20Data%20Deletion%20Request">
            admin@webgrowth.info
          </a> with the subject &quot;Mr Web Social Data Deletion Request&quot;.
          If this concerns NOUNCompass, you may also contact{" "}
          <a href="mailto:support@nouncompass.me">support@nouncompass.me</a>.
          Tell us which business and Facebook Page or Instagram professional account
          the request concerns, and whether you want disconnection, deletion, or both.
          Do not send a password, access token, or OAuth authorization code.
        </p>
        <h2>Step 3: Verification and handling</h2>
        <p>
          We will review the request, verify that the requester is entitled to act
          for the account where necessary, and arrange removal or revocation of
          applicable integration access and associated personal or account data
          held by Mr Web Social. We will explain the outcome and any records that
          must be retained to satisfy lawful security, audit, or other obligations.
          This is currently an email-based request process; this page does not
          claim an automated deletion callback or immediate self-service erasure.
        </p>
        <h2>What this does not delete</h2>
        <p>
          Removing the integration does not automatically delete Facebook or Instagram
          posts, messages, profile information, or other data stored by Meta.
          Manage those items through the relevant Meta account or Meta&apos;s privacy controls.
        </p>
        <h2>Questions or follow-up</h2>
        <p>
          For a pending request, reply to the email correspondence with the support
          team. Please do not include credentials or sensitive personal information.
        </p>
        <p>
          <Link href="/mr-web-social/privacy">Privacy Policy</Link>{" · "}
          <Link href="/mr-web-social/terms">Terms of Use</Link>{" · "}
          <Link href="/mr-web-social/support">Support</Link>
        </p>
      </article>
    </main>
  );
}
