import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mr Web Social — Support | Web Growth",
  description: "Support contacts and help for authorized Facebook Page and Instagram professional account connections to Mr Web Social.",
  alternates: { canonical: "https://webgrowth.info/mr-web-social/support" },
  robots: { index: true, follow: true },
};

export default function MrWebSocialSupportPage() {
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 text-slate-900 dark:text-slate-100">
      <article className="prose prose-slate max-w-none dark:prose-invert">
        <p className="text-sm font-semibold uppercase tracking-wider">Mr Web Social</p>
        <h1>Support</h1>
        <p>
          This page provides support for the Mr Web Social integration connecting
          authorized Facebook Pages and Instagram professional accounts for Web Growth,
          NOUNCompass, and other expressly onboarded businesses.
        </p>
        <h2>Contact the integration operator</h2>
        <p>
          Email <a href="mailto:admin@webgrowth.info">admin@webgrowth.info</a> for
          connection, authorization, access, disconnection, or publishing-workflow questions.
          For a NOUNCompass-specific account, you can also email{" "}
          <a href="mailto:support@nouncompass.me">support@nouncompass.me</a>.
        </p>
        <h2>What to include</h2>
        <ul>
          <li>The business name (Web Growth, NOUNCompass, or the authorized client business).</li>
          <li>The Facebook Page name or Instagram handle involved.</li>
          <li>A short description of the issue and, if relevant, the approximate time it occurred.</li>
          <li>Whether you want to reconnect an account, revoke access, or request deletion.</li>
        </ul>
        <p>
          Do not email passwords, access tokens, OAuth codes, private customer messages,
          or other confidential credentials. We may ask you to verify your authority
          before changing a business account&apos;s connection.
        </p>
        <h2>Disconnecting or deleting data</h2>
        <p>
          You can remove app access through your Meta account&apos;s connected-app settings.
          To request deletion of data held by this integration, follow the{" "}
          <Link href="/mr-web-social/data-deletion">Data Deletion instructions</Link>.
          Revoking integration access does not automatically delete posts already published
          to a Facebook Page or Instagram account.
        </p>
        <h2>Service limitations</h2>
        <p>
          The available functionality depends on the account&apos;s approved permissions,
          Meta app review status, and the business&apos;s authorized configuration.
          A connected account does not by itself enable automatic posting.
        </p>
        <p>
          <Link href="/mr-web-social/privacy">Privacy Policy</Link>{" · "}
          <Link href="/mr-web-social/terms">Terms of Use</Link>{" · "}
          <Link href="/mr-web-social/data-deletion">Data Deletion</Link>
        </p>
      </article>
    </main>
  );
}
