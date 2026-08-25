/**
 * How early access works.
 *
 * Deliberately avoids committing to a launch date or a queue position, because
 * neither is known. Describes the process only.
 */

const steps = [
  {
    number: "01",
    title: "Join the waitlist",
    detail:
      "Tell us which tool you care about and roughly how you would use it. That is the whole signup.",
  },
  {
    number: "02",
    title: "We keep you posted",
    detail:
      "You get product updates as the tools get closer to being usable, not a weekly newsletter.",
  },
  {
    number: "03",
    title: "Early access opens in groups",
    detail:
      "Access is rolled out gradually so we can fix what breaks. Waitlist members are invited before anyone else.",
  },
  {
    number: "04",
    title: "You decide from there",
    detail:
      "An invitation is an offer, not a commitment. If it is not right for you, ignore it or unsubscribe.",
  },
];

export default function EarlyAccessSteps() {
  return (
    <section
      className="automation-section automation-early-access"
      id="early-access"
      aria-labelledby="automation-early-access-title"
    >
      <div className="automation-container automation-section-heading" data-automation-reveal>
        <div>
          <p className="automation-kicker">Early access</p>
          <h2 id="automation-early-access-title">How early access works.</h2>
          <p className="automation-section-lede">
            Both products are still in development, so we are not going to guess a launch date. Here is
            the honest version of what happens next.
          </p>
        </div>
      </div>

      <div className="automation-container automation-steps-grid">
        {steps.map((step) => (
          <article className="automation-step-card" key={step.number} data-automation-reveal>
            <p className="automation-step-number">{step.number}</p>
            <h3>{step.title}</h3>
            <p>{step.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
