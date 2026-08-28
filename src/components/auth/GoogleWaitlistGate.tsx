import GoogleSignInButton from "./GoogleSignInButton";

export default function GoogleWaitlistGate() {
  return (
    <div className="automation-form-shell" data-automation-reveal>
      <p className="automation-kicker">Join the waitlist</p>
      <h3 className="automation-form-title">Sign in with Google to join.</h3>
      <p className="automation-form-intro">
        Waitlist access now starts with Google sign-in, so each signup is tied to a real email account
        before we save it.
      </p>

      <GoogleSignInButton
        nextPath="/automation/#waitlist"
        label="Continue with Google"
        pendingLabel="Opening Google..."
        className="automation-submit automation-submit-ready"
      />

      <p className="automation-form-footnote">
        After Google sign-in, we will use that email for your waitlist record and ask only for the extra
        details we still need.
      </p>
    </div>
  );
}
