import GoogleSignInButton from "./GoogleSignInButton";

type GoogleAdminPromptProps = {
  nextPath: string;
  adminEmail: string;
  googleReady?: boolean;
};

export default function GoogleAdminPrompt({
  nextPath,
  adminEmail,
  googleReady = true,
}: GoogleAdminPromptProps) {
  return (
    <section className="rounded-[28px] border border-white/10 bg-black/35 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.25)] md:p-8">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-5">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">Private admin access</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
              Sign in with the approved Google account
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-white/72">
              Google sign-in is the way into this dashboard, and only{" "}
              <span className="font-semibold text-white">{adminEmail}</span> is approved for it.
              The shared passphrase still works as a fallback while the setup is being finished.
            </p>
          </div>

          {googleReady ? (
            <GoogleSignInButton
              nextPath={nextPath}
              loginHint={adminEmail}
              label="Continue with Google"
              pendingLabel="Opening Google..."
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            />
          ) : (
            <div className="rounded-2xl border border-amber-400/25 bg-amber-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.16em] text-amber-200/90">Not configured here</p>
              <p className="mt-2 text-sm leading-6 text-amber-50/90">
                Google sign-in has no credentials in this environment yet, so use the shared
                passphrase below. Nothing else about this dashboard changes.
              </p>
            </div>
          )}
        </div>

        <div className="space-y-5 rounded-3xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-white/48">Current setup</p>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Google OAuth via Supabase Auth</li>
              <li>Server-sealed session cookie, valid for 12 hours</li>
              <li>Admin access restricted to the approved email list</li>
              <li>Shared passphrase still accepted as a fallback</li>
              <li>WhatsApp and waitlist dashboards share the same admin gate</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
