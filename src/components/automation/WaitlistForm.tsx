"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import TurnstileWidget from "@/components/TurnstileWidget";
import { trackAutomationEvent } from "@/components/automation/analytics";
import {
  WAITLIST_BUSINESS_SIZES,
  WAITLIST_INTERESTS,
  WAITLIST_LIMITS,
  validateWaitlistSubmission,
  type WaitlistFieldErrors,
} from "@/lib/waitlist/schema";

/**
 * Waitlist signup form.
 *
 * Validation runs through the same validateWaitlistSubmission() the API route
 * uses, so client feedback and server enforcement cannot drift. The client result
 * is only ever used for inline messages; the server revalidates every request
 * and is the authority.
 *
 * The success state reports the real `emailSent` value returned by the server. If
 * the confirmation email failed, the copy says the signup is saved and does not
 * claim an email was sent.
 *
 * No page reload on success: the form is replaced in place.
 */

type Status = "idle" | "sending" | "success" | "error";

type FormValues = {
  fullName: string;
  email: string;
  businessName: string;
  interest: string;
  useCase: string;
  businessSize: string;
  /** Honeypot. Never shown to a person and never submitted with a value. */
  companyWebsite: string;
};

const INITIAL_VALUES: FormValues = {
  fullName: "",
  email: "",
  businessName: "",
  interest: "",
  useCase: "",
  businessSize: "",
  companyWebsite: "",
};

const GENERIC_ERROR = "We couldn't submit your request right now. Please try again.";

type WaitlistFormProps = {
  sessionEmail: string;
  sessionFullName?: string;
};

export default function WaitlistForm({ sessionEmail, sessionFullName = "" }: WaitlistFormProps) {
  const [values, setValues] = useState<FormValues>({
    ...INITIAL_VALUES,
    fullName: sessionFullName,
    email: sessionEmail,
  });
  const [fieldErrors, setFieldErrors] = useState<WaitlistFieldErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const interestReported = useRef(false);
  const successHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const turnstileEnabled = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function updateValue<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    // Clear a field's error as soon as the visitor edits it, so the message does
    // not linger while they are fixing it.
    setFieldErrors((current) => {
      if (!current[key as keyof WaitlistFieldErrors]) return current;
      const next = { ...current };
      delete next[key as keyof WaitlistFieldErrors];
      return next;
    });
  }

  function handleInterestChange(value: string) {
    updateValue("interest", value);

    // One event per visitor, and only the fixed enum value. Never any PII.
    if (!interestReported.current) {
      interestReported.current = true;
      trackAutomationEvent("automation_product_interest_selected", { interest: value });
    }
  }

  /** Re-validate a single field on blur so problems surface before submit. */
  function handleBlur(field: keyof WaitlistFieldErrors) {
    const result = validateWaitlistSubmission(values);
    if (result.ok) {
      setFieldErrors({});
      return;
    }

    const message = result.errors[field];
    setFieldErrors((current) => {
      const next = { ...current };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validation = validateWaitlistSubmission(values);
    if (!validation.ok) {
      setFieldErrors(validation.errors);
      setStatus("error");
      setFormError("Please check the highlighted fields.");

      // Move focus to the first field with a problem.
      const order: (keyof WaitlistFieldErrors)[] = [
        "fullName",
        "email",
        "businessName",
        "interest",
        "useCase",
        "businessSize",
      ];
      const firstInvalid = order.find((field) => validation.errors[field]);
      if (firstInvalid) {
        document.getElementById(`waitlist-${firstInvalid}`)?.focus();
      }
      return;
    }

    if (turnstileEnabled && !turnstileToken) {
      setStatus("error");
      setFormError("Please complete the spam check and try again.");
      return;
    }

    setStatus("sending");
    setFormError("");
    setFieldErrors({});

    trackAutomationEvent("automation_waitlist_submitted", { interest: validation.value.interest });

    try {
      const response = await fetch("/api/automation-waitlist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...validation.value,
          companyWebsite: values.companyWebsite,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = (await response.json().catch(() => null)) as
        | { ok?: boolean; emailSent?: boolean; error?: string; fieldErrors?: WaitlistFieldErrors }
        | null;

      if (!response.ok || !data?.ok) {
        setStatus("error");
        setFieldErrors(data?.fieldErrors || {});
        setFormError(data?.error || GENERIC_ERROR);
        setTurnstileResetKey((current) => current + 1);
        return;
      }

      // The server's real result, never assumed.
      setEmailSent(data.emailSent === true);
      setStatus("success");

      trackAutomationEvent("automation_waitlist_success", {
        interest: validation.value.interest,
        confirmation_email_sent: data.emailSent === true,
      });

      setValues({
        ...INITIAL_VALUES,
        fullName: sessionFullName,
        email: sessionEmail,
      });
      setTurnstileResetKey((current) => current + 1);

      // Send focus to the confirmation so screen-reader and keyboard users land
      // on the outcome rather than at the top of the page.
      window.setTimeout(() => successHeadingRef.current?.focus(), 50);
    } catch {
      setStatus("error");
      setFormError("Network error. Please check your connection and try again.");
      setTurnstileResetKey((current) => current + 1);
    }
  }

  if (status === "success") {
    return (
      <div className="automation-form-shell automation-form-success" data-automation-reveal>
        <p className="automation-kicker">Waitlist confirmed</p>
        <h3 tabIndex={-1} ref={successHeadingRef} className="automation-success-title">
          You&rsquo;re on the list.
        </h3>
        <p className="automation-success-copy">
          We&rsquo;ll keep you updated as Web Growth Automation gets closer to launch.
        </p>

        <p className="automation-success-email" role="status">
          {emailSent ? (
            <>
              A confirmation email is on its way. If it does not arrive in a few minutes, check your
              spam folder.
            </>
          ) : (
            <>
              Your signup is saved. We could not send the confirmation email just now, so you may not
              receive one, but you are on the list either way, and nothing else is needed from
              you.
            </>
          )}
        </p>

        <p className="automation-form-footnote">
          Want to change something or come off the list? Email{" "}
          <a href="mailto:admin@webgrowth.info">admin@webgrowth.info</a> and we will sort it out.
        </p>
      </div>
    );
  }

  const sending = status === "sending";

  return (
    <div className="automation-form-shell" data-automation-reveal>
      <p className="automation-kicker">Join the waitlist</p>
      <h3 className="automation-form-title">Be among the first to get access.</h3>
      <p className="automation-form-intro">
        Tell us which tool matters to you and how you would use it. That helps us build the right thing
        first, and it decides what we send you.
      </p>
      <p className="automation-form-footnote">
        Signed in as <span className="font-semibold">{sessionEmail}</span>. This Google account email will
        be used for your waitlist record.
      </p>

      {status === "error" && formError ? (
        <p className="automation-form-alert" role="alert">
          {formError}
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="automation-form-fields" noValidate>
        <div className="automation-form-grid">
          <div className="automation-field">
            <label htmlFor="waitlist-fullName" className="automation-label">
              Full name <span className="automation-required">*</span>
            </label>
            <input
              id="waitlist-fullName"
              name="fullName"
              type="text"
              autoComplete="name"
              required
              maxLength={WAITLIST_LIMITS.fullNameMax}
              value={values.fullName}
              onChange={(event) => updateValue("fullName", event.target.value)}
              onBlur={() => handleBlur("fullName")}
              className="automation-control"
              aria-invalid={fieldErrors.fullName ? true : undefined}
              aria-describedby={fieldErrors.fullName ? "waitlist-fullName-error" : undefined}
            />
            {fieldErrors.fullName ? (
              <p className="automation-field-error" id="waitlist-fullName-error">
                {fieldErrors.fullName}
              </p>
            ) : null}
          </div>

          <div className="automation-field">
            <label htmlFor="waitlist-email" className="automation-label">
              Google account email
            </label>
            <input
              id="waitlist-email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={WAITLIST_LIMITS.emailMax}
              value={sessionEmail}
              readOnly
              disabled
              className="automation-control opacity-75"
            />
          </div>
        </div>

        <div className="automation-form-grid">
          <div className="automation-field">
            <label htmlFor="waitlist-businessName" className="automation-label">
              Business or brand name
            </label>
            <input
              id="waitlist-businessName"
              name="businessName"
              type="text"
              autoComplete="organization"
              maxLength={WAITLIST_LIMITS.businessNameMax}
              value={values.businessName}
              onChange={(event) => updateValue("businessName", event.target.value)}
              className="automation-control"
            />
          </div>

          <div className="automation-field">
            <label htmlFor="waitlist-businessSize" className="automation-label">
              Business size
            </label>
            <select
              id="waitlist-businessSize"
              name="businessSize"
              value={values.businessSize}
              onChange={(event) => updateValue("businessSize", event.target.value)}
              className="automation-control"
              aria-invalid={fieldErrors.businessSize ? true : undefined}
              aria-describedby={
                fieldErrors.businessSize ? "waitlist-businessSize-error" : undefined
              }
            >
              <option value="">Prefer not to say</option>
              {WAITLIST_BUSINESS_SIZES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {fieldErrors.businessSize ? (
              <p className="automation-field-error" id="waitlist-businessSize-error">
                {fieldErrors.businessSize}
              </p>
            ) : null}
          </div>
        </div>

        <fieldset
          className="automation-fieldset"
          aria-invalid={fieldErrors.interest ? true : undefined}
          aria-describedby={fieldErrors.interest ? "waitlist-interest-error" : undefined}
        >
          <legend className="automation-label">
            What are you most interested in? <span className="automation-required">*</span>
          </legend>
          <div className="automation-radio-group">
            {WAITLIST_INTERESTS.map((option, index) => (
              <label className="automation-radio" key={option.value}>
                <input
                  type="radio"
                  name="interest"
                  // The first radio carries the shared id so focus management and
                  // the error's aria-describedby have a single target.
                  id={index === 0 ? "waitlist-interest" : `waitlist-interest-${option.value}`}
                  value={option.value}
                  checked={values.interest === option.value}
                  onChange={() => handleInterestChange(option.value)}
                  required
                />
                <span className="automation-radio-box" aria-hidden="true" />
                <span className="automation-radio-label">{option.label}</span>
              </label>
            ))}
          </div>
          {fieldErrors.interest ? (
            <p className="automation-field-error" id="waitlist-interest-error">
              {fieldErrors.interest}
            </p>
          ) : null}
        </fieldset>

        <div className="automation-field">
          <label htmlFor="waitlist-useCase" className="automation-label">
            How would you use it?
          </label>
          <p className="automation-field-hint" id="waitlist-useCase-hint">
            A sentence is plenty. What takes up your time right now?
          </p>
          <textarea
            id="waitlist-useCase"
            name="useCase"
            rows={4}
            maxLength={WAITLIST_LIMITS.useCaseMax}
            value={values.useCase}
            onChange={(event) => updateValue("useCase", event.target.value)}
            className="automation-control"
            aria-describedby="waitlist-useCase-hint"
            placeholder="e.g. I answer the same three questions on WhatsApp all day and post on TikTok twice a week."
          />
        </div>

        {/*
          Honeypot. Hidden from sight and from assistive technology, never
          autofilled, and excluded from the tab order, so only a script fills it.
        */}
        <div className="automation-honeypot" aria-hidden="true">
          <label htmlFor="waitlist-companyWebsite">Company website</label>
          <input
            id="waitlist-companyWebsite"
            name="companyWebsite"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.companyWebsite}
            onChange={(event) => updateValue("companyWebsite", event.target.value)}
          />
        </div>

        {turnstileEnabled ? (
          <div className="automation-spam-check">
            <p className="automation-label">Spam check</p>
            <TurnstileWidget
              action="automation_waitlist"
              theme="light"
              onTokenChange={setTurnstileToken}
              resetKey={turnstileResetKey}
              containerClassName="automation-turnstile"
            />
          </div>
        ) : null}

        <button
          type="submit"
          disabled={sending}
          className={`automation-submit ${sending ? "automation-submit-disabled" : "automation-submit-ready"}`}
        >
          {sending ? "Joining..." : "Join the Waitlist"}
        </button>

        <p className="automation-form-status" role="status" aria-live="polite">
          {sending ? "Submitting your details..." : ""}
        </p>

        <p className="automation-form-footnote">
          By joining, you agree that Web Growth can email you about Web Growth Automation. We will not
          add you to any unrelated newsletter, and you can unsubscribe at any time. See our{" "}
          <Link href="/privacy/">Privacy Policy</Link> for how your details are handled.
        </p>
      </form>
    </div>
  );
}
