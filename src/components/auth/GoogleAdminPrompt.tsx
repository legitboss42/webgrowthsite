import Image from "next/image";
import { isWorkspacePasswordAuthConfigured } from "@/lib/whatsapp/passwordAuth";
import GoogleSignInButton from "./GoogleSignInButton";
import WorkspacePasswordSignIn from "./WorkspacePasswordSignIn";

type GoogleAdminPromptProps = {
  nextPath: string;
  adminEmail: string;
  clientId?: string;
  googleReady?: boolean;
  workspaceTeamAccess?: boolean;
};

function WorkspacePreview() {
  return (
    <div className="relative mt-9 overflow-hidden rounded-[26px] border border-white/10 bg-[#f5f7f5] shadow-[0_30px_70px_rgba(0,0,0,.28)]">
      <div className="flex h-11 items-center gap-2 border-b border-[#dfe5e0] bg-white px-4">
        <span className="h-2.5 w-2.5 rounded-full bg-[#1c7a54]" />
        <span className="text-[11px] font-semibold text-[#5f6e66]">Web Growth WhatsApp</span>
        <span className="ml-auto h-2 w-12 rounded-full bg-[#e6ebe7]" />
      </div>
      <div className="grid min-h-[280px] grid-cols-[34%_66%]">
        <div className="border-r border-[#dfe5e0] bg-white p-3">
          <div className="mb-3 h-8 rounded-lg bg-[#edf1ee]" />
          {[
            ["AM", "Adeola Motors", "Can we start this week?"],
            ["JL", "J Luxe", "Thanks, received."],
            ["NK", "Nkem Stores", "I need an online shop"],
          ].map(([initials, name, text], index) => (
            <div key={name} className={`flex gap-2.5 rounded-xl p-2.5 ${index === 0 ? "bg-[#e4f0e9]" : ""}`}>
              <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#124a38] text-[10px] font-bold text-white">{initials}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-semibold text-[#1d2b24]">{name}</p>
                <p className="mt-1 truncate text-[9px] text-[#8a9790]">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col bg-[#eef2ef]">
          <div className="flex h-12 items-center gap-2 border-b border-[#dfe5e0] bg-white px-4">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-[#124a38] text-[9px] font-bold text-white">AM</span>
            <div>
              <p className="text-[10px] font-semibold text-[#1d2b24]">Adeola Motors</p>
              <p className="text-[8px] text-[#1c7a54]">Open conversation</p>
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="max-w-[78%] rounded-2xl rounded-tl-sm bg-white px-3 py-2.5 text-[9px] leading-4 text-[#536159] shadow-sm">Hi, I need a new business website. Can we start this week?</div>
            <div className="ml-auto max-w-[78%] rounded-2xl rounded-tr-sm bg-[#d5f0df] px-3 py-2.5 text-[9px] leading-4 text-[#254235] shadow-sm">Absolutely. I can help you get the project details together.</div>
            <div className="mt-auto h-9 rounded-xl border border-[#d9dfda] bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GoogleAdminPrompt({
  nextPath,
  adminEmail,
  clientId = "",
  googleReady = true,
  workspaceTeamAccess = false,
}: GoogleAdminPromptProps) {
  const passwordReady = isWorkspacePasswordAuthConfigured();

  return (
    <section className="overflow-hidden rounded-[30px] border border-white/10 bg-white shadow-[0_34px_100px_rgba(0,0,0,.38)]">
      <div className="grid lg:grid-cols-[1.08fr_.92fr]">
        <div className="relative overflow-hidden bg-[#0b241a] p-7 text-white sm:p-9 lg:min-h-[620px] lg:p-10">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(48,167,112,.24),transparent_30%),radial-gradient(circle_at_90%_80%,rgba(180,128,47,.16),transparent_34%)]" />
          <div className="relative">
            <Image
              src="/images/brand/web-growth-logo.webp"
              alt="Web Growth"
              width={270}
              height={40}
              sizes="190px"
              quality={75}
              priority
              className="h-auto w-[190px]"
            />

            <div className="mt-12 max-w-lg">
              <p className="text-xs font-semibold uppercase tracking-[.2em] text-emerald-200/65">WhatsApp Business Workspace</p>
              <h1 className="mt-4 font-display text-4xl font-semibold leading-[1.02] tracking-[-.035em] text-white sm:text-5xl">Conversations, customers and your team in one place.</h1>
              <p className="mt-5 max-w-md text-sm leading-7 text-white/62">Manage your Web Growth WhatsApp workspace from a single dashboard.</p>
            </div>

            <WorkspacePreview />
          </div>
        </div>

        <div className="flex items-center bg-[#f8faf8] px-6 py-10 sm:px-9 lg:px-10">
          <div className="mx-auto w-full max-w-[390px]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[.17em] text-[#1c7a54]">Web Growth</p>
              <h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.025em] text-[#14251d]">Welcome back</h2>
              <p className="mt-2 text-sm leading-6 text-[#718078]">Sign in to continue to your workspace.</p>
            </div>

            {workspaceTeamAccess ? (
              <div className="mt-8">
                <WorkspacePasswordSignIn nextPath={nextPath} available={passwordReady} />

                <div className="my-6 flex items-center gap-3">
                  <span className="h-px flex-1 bg-[#dce2dd]" />
                  <span className="text-[11px] font-medium uppercase tracking-[.14em] text-[#8a9690]">or</span>
                  <span className="h-px flex-1 bg-[#dce2dd]" />
                </div>

                {googleReady ? (
                  <GoogleSignInButton
                    nextPath={nextPath}
                    clientId={clientId}
                    label="Continue with Google"
                    pendingLabel="Signing you in..."
                    className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#d7ddd8] bg-white px-5 text-sm font-semibold text-[#24342c]"
                  />
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">Google sign-in is temporarily unavailable.</p>
                )}

                <p className="mt-7 text-center text-xs leading-5 text-[#8a9690]">Use the email on your Web Growth workspace invitation.</p>
              </div>
            ) : (
              <div className="mt-8">
                {googleReady ? (
                  <GoogleSignInButton
                    nextPath={nextPath}
                    clientId={clientId}
                    loginHint={adminEmail}
                    label="Continue with Google"
                    pendingLabel="Signing you in..."
                    className="flex min-h-12 w-full items-center justify-center rounded-xl border border-[#d7ddd8] bg-white px-5 text-sm font-semibold text-[#24342c]"
                  />
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-5 text-amber-800">Google sign-in is temporarily unavailable.</p>
                )}
              </div>
            )}

            <div className="mt-10 border-t border-[#e0e5e1] pt-5 text-center text-[11px] text-[#97a19b]">Web Growth · Private workspace</div>
          </div>
        </div>
      </div>
    </section>
  );
}
