"use client";

import { useState } from "react";

type GoogleSignInButtonProps = {
  nextPath: string;
  label: string;
  pendingLabel: string;
  className: string;
  loginHint?: string;
};

export default function GoogleSignInButton({
  nextPath,
  label,
  pendingLabel,
  className,
  loginHint,
}: GoogleSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <form action="/api/auth/google/start/" method="get" className="space-y-3" onSubmit={() => setIsLoading(true)}>
      <input type="hidden" name="next" value={nextPath} />
      {loginHint ? <input type="hidden" name="login_hint" value={loginHint} /> : null}
      <button type="submit" disabled={isLoading} className={className}>
        {isLoading ? pendingLabel : label}
      </button>
    </form>
  );
}
