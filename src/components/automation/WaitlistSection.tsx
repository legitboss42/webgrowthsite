import { cookies } from "next/headers";
import WaitlistForm from "@/components/automation/WaitlistForm";
import GoogleWaitlistGate from "@/components/auth/GoogleWaitlistGate";
import {
  getGoogleClientId,
  isGoogleAuthConfigured,
  readGoogleAuthSessionFromCookieStore,
} from "@/lib/googleAuth";
import { readWebGrowthSessionFromCookieStore } from "@/lib/webGrowthSession";

/**
 * Waitlist section: the form plus the reassurance that belongs next to it.
 *
 * Google sign-in now writes the canonical Web Growth session. Read that first,
 * while retaining the old Google cookie as a short migration fallback for
 * visitors who already had a valid legacy session before the account unification.
 * Only a Google-backed identity unlocks the waitlist form; password/TikTok
 * sessions do not silently become waitlist consent.
 */

const assurances = [
  {
    title: "We only email you about this",
    detail:
      "Waitlist signups are used for Web Growth Automation updates and early-access invitations. Nothing else.",
  },
  {
    title: "Your details stay with us",
    detail: "We do not sell or share your information with third parties for marketing.",
  },
  {
    title: "Leaving is easy",
    detail:
      "Every email includes an unsubscribe link, and you can ask us to delete your details at any time.",
  },
  {
    title: "No payment details",
    detail: "Joining the waitlist costs nothing and does not ask for card information.",
  },
];

export default async function WaitlistSection() {
  const cookieStore = await cookies();
  const canonicalSession = readWebGrowthSessionFromCookieStore(cookieStore);
  const canonicalGoogleSession =
    canonicalSession?.provider === "google" && canonicalSession.email
      ? canonicalSession
      : null;
  const legacyGoogleSession = canonicalGoogleSession
    ? null
    : readGoogleAuthSessionFromCookieStore(cookieStore);
  const sessionIdentity = canonicalGoogleSession
    ? {
        email: canonicalGoogleSession.email as string,
        fullName: canonicalGoogleSession.fullName || "",
      }
    : legacyGoogleSession
      ? {
          email: legacyGoogleSession.email,
          fullName: legacyGoogleSession.fullName || "",
        }
      : null;

  return (
    <section
      className="automation-section automation-waitlist"
      id="waitlist"
      aria-labelledby="automation-waitlist-title"
    >
      <div className="automation-container automation-waitlist-grid">
        <div className="automation-waitlist-copy" data-automation-reveal>
          <p className="automation-kicker">Early access</p>
          <h2 id="automation-waitlist-title">
            Get access before it opens to everyone.
          </h2>
          <p className="automation-section-lede">
            Both tools are being built now. The waitlist is how we decide what to finish first, and who
            gets in early.
          </p>

          <dl className="automation-assurance-list">
            {assurances.map((item) => (
              <div key={item.title}>
                <dt>
                  <span aria-hidden="true" />
                  {item.title}
                </dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="automation-waitlist-form">
          {sessionIdentity ? (
            <div className="space-y-4">
              <div
                className="rounded-[20px] border border-emerald-300/20 bg-emerald-300/10 px-5 py-4 text-sm leading-6 text-emerald-50"
                role="status"
              >
                <p className="font-semibold">Google account connected.</p>
                <p className="text-emerald-50/75">Complete this short form to join the waitlist.</p>
              </div>
              <WaitlistForm
                sessionEmail={sessionIdentity.email}
                sessionFullName={sessionIdentity.fullName}
              />
            </div>
          ) : (
            <GoogleWaitlistGate clientId={getGoogleClientId()} googleReady={isGoogleAuthConfigured()} />
          )}
        </div>
      </div>
    </section>
  );
}
