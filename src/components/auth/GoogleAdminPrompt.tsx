import GoogleSignInButton from "./GoogleSignInButton";

type GoogleAdminPromptProps = {
  nextPath: string;
  adminEmail: string;
  clientId?: string;
  googleReady?: boolean;
  workspaceTeamAccess?: boolean;
};

export default function GoogleAdminPrompt({
  nextPath,
  adminEmail,
  clientId = "",
  googleReady = true,
  workspaceTeamAccess = false,
}: GoogleAdminPromptProps) {
  const title = workspaceTeamAccess
    ? "Sign in with your Web Growth team Google account."
    : "Enter the dashboard with the approved Google account.";
  const description = workspaceTeamAccess
    ? "Use the same Google account that received your WhatsApp workspace invitation. Active team membership is checked on every request."
    : `This gate is intentionally narrow. Only ${adminEmail} can open this admin surface, and the session is sealed on the server after sign-in.`;

  return (
    <section className="relative overflow-hidden rounded-[36px] border border-[#d9c9ae]/16 bg-[#0d110d] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.35)] md:p-8">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,182,120,0.16),transparent_42%),radial-gradient(circle_at_85%_18%,rgba(93,151,121,0.18),transparent_30%),linear-gradient(145deg,rgba(255,255,255,0.02),transparent_55%)]"
      />

      <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_22rem]">
        <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.28em] text-[#d7c9b2]/72">
            <span className="rounded-full border border-[#d6b678]/25 bg-[#d6b678]/10 px-3 py-1 text-[#efd8a8]">
              {workspaceTeamAccess ? "Private team access" : "Private admin access"}
            </span>
            <span className="rounded-full border border-white/10 px-3 py-1 text-white/55">
              Google-only entry
            </span>
          </div>

          <h2 className="mt-6 max-w-3xl font-display text-4xl font-medium leading-[0.95] tracking-[-0.04em] text-[#f8f1e7] md:text-5xl">
            {title}
          </h2>

          <p className="mt-5 max-w-2xl text-base leading-7 text-[#e9dfcf]/74 md:text-[1.05rem]">
            {description}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <article className="rounded-[24px] border border-white/10 bg-black/18 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#d7c9b2]/60">
                {workspaceTeamAccess ? "Approved identity" : "Approved account"}
              </p>
              <p className="mt-4 font-mono text-sm text-[#f8f1e7]">
                {workspaceTeamAccess ? "Your invited Google email" : adminEmail}
              </p>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {workspaceTeamAccess
                  ? "Owner, Manager, and Agent access is resolved from the active WhatsApp team record after Google proves the email address."
                  : "Google will be nudged toward this address first, but only the allowlisted account can complete the session."}
              </p>
            </article>

            <article className="rounded-[24px] border border-white/10 bg-black/18 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#d7c9b2]/60">Session posture</p>
              <p className="mt-4 font-display text-2xl text-[#f8f1e7]">12-hour sealed access</p>
              <p className="mt-3 text-sm leading-6 text-white/62">
                {workspaceTeamAccess
                  ? "The session proves identity, but active team status is still checked server-side so deactivation revokes workspace access."
                  : "Google proves identity once. After that, the app relies on its own signed admin cookie."}
              </p>
            </article>
          </div>

          <div className="mt-8">
            {googleReady ? (
              <GoogleSignInButton
                nextPath={nextPath}
                clientId={clientId}
                loginHint={workspaceTeamAccess ? undefined : adminEmail}
                label="Continue with Google"
                pendingLabel="Signing you in..."
                className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#d6b678]/30 bg-[#e7d1a5] px-7 py-3 text-sm font-semibold text-[#17140e] shadow-[0_14px_36px_rgba(231,209,165,0.22)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#f1dfbd] disabled:cursor-not-allowed disabled:opacity-60"
              />
            ) : (
              <div className="max-w-xl rounded-[24px] border border-amber-300/20 bg-amber-300/10 p-5">
                <p className="text-[11px] uppercase tracking-[0.24em] text-amber-100/78">
                  Google sign-in unavailable here
                </p>
                <p className="mt-3 text-sm leading-6 text-amber-50/86">
                  This environment does not have the Google OAuth credentials needed for this access gate.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="rounded-[30px] border border-white/10 bg-[#111712]/90 p-6">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#d7c9b2]/60">What this protects</p>
          <ul className="mt-5 space-y-4 text-sm leading-6 text-white/72">
            {workspaceTeamAccess ? (
              <>
                <li className="border-b border-white/8 pb-4">WhatsApp conversations, contacts, calls, and approved team tools</li>
                <li className="border-b border-white/8 pb-4">Role-based Owner, Manager, and Agent permissions</li>
                <li className="border-b border-white/8 pb-4">Conversation assignment and customer replies</li>
                <li>Immediate server-side denial for deactivated team members</li>
              </>
            ) : (
              <>
                <li className="border-b border-white/8 pb-4">WhatsApp inbox, templates, and integration settings</li>
                <li className="border-b border-white/8 pb-4">Automation waitlist records and triage notes</li>
                <li className="border-b border-white/8 pb-4">One admin gate shared across internal surfaces</li>
                <li>Server-side email allowlist before any dashboard redirect completes</li>
              </>
            )}
          </ul>
        </aside>
      </div>
    </section>
  );
}
