import GoogleSignInButton from "./GoogleSignInButton";

export default function GoogleWaitlistGate() {
  return (
    <div
      className="automation-form-shell relative overflow-hidden border border-[rgba(209,188,154,0.18)] bg-[linear-gradient(180deg,rgba(20,23,18,0.96),rgba(10,12,10,0.98))]"
      data-automation-reveal
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(214,182,120,0.16),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(80,139,104,0.16),transparent_28%)]"
      />

      <div className="relative">
        <p className="automation-kicker !text-[#f0d8aa]">Join the waitlist</p>
        <h3 className="automation-form-title max-w-xl !font-display !text-[clamp(2rem,4vw,3rem)] !leading-[0.98] !tracking-[-0.04em] !text-[#fff8ec]">
          Start with Google, then finish the short access form.
        </h3>
        <p className="automation-form-intro max-w-2xl !text-[#ede1cf]/72">
          Every signup is tied to a real email account first through Google, which keeps the waitlist cleaner and
          lets us prefill the email you already trust.
        </p>

        <div className="mt-8 grid gap-3 text-sm text-[#ede1cf]/70 sm:grid-cols-3">
          <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">Real email identity</div>
          <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">No card required</div>
          <div className="rounded-[20px] border border-white/10 bg-black/18 px-4 py-3">Two-step join flow</div>
        </div>

        <div className="mt-8">
          <GoogleSignInButton
            nextPath="/automation/#waitlist"
            label="Continue with Google"
            pendingLabel="Opening Google..."
            className="inline-flex min-h-14 items-center justify-center rounded-full border border-[#d6b678]/30 bg-[#e7d1a5] px-7 py-3 text-sm font-semibold text-[#17140e] shadow-[0_14px_36px_rgba(231,209,165,0.22)] transition-transform duration-200 hover:-translate-y-0.5 hover:bg-[#f1dfbd] disabled:cursor-not-allowed disabled:opacity-60"
          />
        </div>

        <p className="automation-form-footnote mt-6 !text-[#d2c3ad]/68">
          After Google sign-in, we use that email for your waitlist record and ask only for the extra
          business details we still need.
        </p>
      </div>
    </div>
  );
}
