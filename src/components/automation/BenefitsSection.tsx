/**
 * Benefits and audience sections.
 *
 * Grouped because both are simple content grids with the same shape. Benefits are
 * written as outcomes, without invented metrics, percentages or customer counts.
 */

const benefits = [
  {
    title: "Get your evenings back",
    detail:
      "The replies that keep you on your phone after closing are the first thing worth automating.",
  },
  {
    title: "Stop losing enquiries to timing",
    detail:
      "People decide fast. An immediate answer keeps the conversation alive until you can join it.",
  },
  {
    title: "Post on schedule, not on memory",
    detail: "A planned week that actually goes out beats a good intention every time.",
  },
  {
    title: "Keep customer history in one place",
    detail:
      "Conversations, notes, and tags stay with the contact rather than on whichever phone answered.",
  },
  {
    title: "Hand work over without the mess",
    detail:
      "A shared inbox means bringing someone in does not mean handing over a personal device.",
  },
  {
    title: "See what is actually happening",
    detail: "A clear view of what went out and what came back, instead of a feeling.",
  },
];

const audiences = [
  {
    title: "Local service businesses",
    detail:
      "Salons, clinics, repairs, trades: anyone who answers the same handful of questions all day.",
  },
  {
    title: "Online sellers",
    detail: "Stores that take orders and answer stock questions over WhatsApp.",
  },
  {
    title: "Creators and small brands",
    detail: "People posting regularly who need scheduling to stop being a daily chore.",
  },
  {
    title: "Small teams sharing one number",
    detail: "Two to twenty people who need to answer from the same place without stepping on each other.",
  },
];

export default function BenefitsSection() {
  return (
    <>
      <section
        className="automation-section automation-benefits"
        id="benefits"
        aria-labelledby="automation-benefits-title"
      >
        <div className="automation-container automation-section-heading" data-automation-reveal>
          <div>
            <p className="automation-kicker">Why it matters</p>
            <h2 id="automation-benefits-title">What this is meant to change day to day.</h2>
          </div>
        </div>

        <div className="automation-container automation-benefit-grid">
          {benefits.map((benefit) => (
            <article className="automation-benefit-card" key={benefit.title} data-automation-reveal>
              <h3>{benefit.title}</h3>
              <p>{benefit.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <section
        className="automation-section automation-audience"
        id="who-its-for"
        aria-labelledby="automation-audience-title"
      >
        <div className="automation-container automation-section-heading" data-automation-reveal>
          <div>
            <p className="automation-kicker">Who it is for</p>
            <h2 id="automation-audience-title">Built for businesses doing the work themselves.</h2>
            <p className="automation-section-lede">
              If your customer conversations and your content both run through your own phone, this is
              being built for you.
            </p>
          </div>
        </div>

        <div className="automation-container automation-audience-grid">
          {audiences.map((audience) => (
            <article className="automation-audience-card" key={audience.title} data-automation-reveal>
              <h3>{audience.title}</h3>
              <p>{audience.detail}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
