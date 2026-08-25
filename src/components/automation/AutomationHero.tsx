import Link from "next/link";

/**
 * Hero visual: a three-step automation flow that fills in on entrance.
 *
 * A pure server component. All movement is CSS driven by the `is-running` class
 * that AutomationMotion adds while the element is on screen, so there is no
 * JavaScript animation loop and nothing runs offscreen. Every label is real text
 * in the DOM, so with motion disabled this reads as a finished diagram rather
 * than an empty frame.
 *
 * Nothing here touches the TikTok or WhatsApp production systems. The content is
 * fixed illustrative copy, not live data, and no request leaves the page.
 *
 * Deliberately NOT marked with `data-automation-reveal`. That hook sets
 * `opacity: 0` as soon as the motion class lands, which for above-the-fold
 * content would hide the LCP element until hydration and the first
 * IntersectionObserver callback, and would flash the already-painted hero out and
 * back in. The hero therefore paints in its final state and only the flow steps
 * inside it animate: the motion that actually explains the product.
 */

const flowSteps = [
  {
    stage: "Trigger",
    title: "A customer messages you",
    detail: "A new WhatsApp enquiry arrives while you are with someone else.",
  },
  {
    stage: "Rule",
    title: "Your setup decides what happens",
    detail: "The enquiry is answered, tagged, and routed to the right person.",
  },
  {
    stage: "Result",
    title: "The work is already done",
    detail: "You pick up a conversation that has context instead of starting cold.",
  },
];

export default function AutomationHero() {
  return (
    <section className="automation-hero" aria-labelledby="automation-hero-title">
      <div className="automation-container automation-hero-grid">
        <div className="automation-hero-copy">
          <p className="automation-kicker">Web Growth Automation &middot; Coming soon</p>
          <h1 id="automation-hero-title">
            Automate the work that <span>slows your business down</span>.
          </h1>
          <p className="automation-lede">
            Web Growth is building two tools for the jobs that quietly eat your week: replying to the
            same WhatsApp questions over and over, and getting TikTok content out on time. Both are in
            development, and early access opens to the waitlist first.
          </p>

          <div className="automation-actions">
            <Link
              className="automation-button automation-button-primary"
              href="#waitlist"
              data-automation-cta="hero_primary"
            >
              Join the Waitlist
            </Link>
            <Link
              className="automation-button automation-button-secondary"
              href="#products"
              data-automation-cta="hero_secondary"
            >
              See what we are building
            </Link>
          </div>

          <p className="automation-hero-note">
            Currently in development &middot; No payment details required
          </p>
        </div>

        <div className="automation-hero-visual">
          <figure
            className="automation-flow"
            data-automation-demo="hero_flow"
            aria-labelledby="automation-flow-caption"
          >
            <figcaption id="automation-flow-caption" className="automation-flow-caption">
              How an automation runs, start to finish
            </figcaption>

            <ol className="automation-flow-list">
              {flowSteps.map((step, index) => (
                <li
                  className="automation-flow-step"
                  key={step.stage}
                  style={{ ["--step" as string]: String(index) }}
                >
                  <div className="automation-flow-marker" aria-hidden="true">
                    <span>{index + 1}</span>
                  </div>
                  <div className="automation-flow-body">
                    <p className="automation-flow-stage">{step.stage}</p>
                    <h2 className="automation-flow-title">{step.title}</h2>
                    <p className="automation-flow-detail">{step.detail}</p>
                  </div>
                </li>
              ))}
            </ol>

            <p className="automation-flow-footer">
              <span aria-hidden="true" className="automation-flow-pulse" />
              Illustration of a planned workflow
            </p>
          </figure>
        </div>
      </div>
    </section>
  );
}
