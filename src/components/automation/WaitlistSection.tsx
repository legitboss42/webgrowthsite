import WaitlistForm from "@/components/automation/WaitlistForm";

/**
 * Waitlist section: the form plus the reassurance that belongs next to it.
 *
 * The trust points describe what we actually do. There are no invented
 * certifications, compliance badges, audit claims or signup counts.
 */

const assurances = [
  {
    title: "We only email you about this",
    detail:
      "Waitlist signups are used for Web Growth Automation updates and early-access invitations. Nothing else.",
  },
  {
    title: "Your details stay with us",
    detail: "We do not sell or share your information with third parties for marketing.",
  },
  {
    title: "Leaving is easy",
    detail:
      "Every email includes an unsubscribe link, and you can ask us to delete your details at any time.",
  },
  {
    title: "No payment details",
    detail: "Joining the waitlist costs nothing and does not ask for card information.",
  },
];

export default function WaitlistSection() {
  return (
    <section
      className="automation-section automation-waitlist"
      id="waitlist"
      aria-labelledby="automation-waitlist-title"
    >
      <div className="automation-container automation-waitlist-grid">
        <div className="automation-waitlist-copy" data-automation-reveal>
          <p className="automation-kicker">Early access</p>
          <h2 id="automation-waitlist-title">
            Get access before it opens to everyone.
          </h2>
          <p className="automation-section-lede">
            Both tools are being built now. The waitlist is how we decide what to finish first, and who
            gets in early.
          </p>

          <dl className="automation-assurance-list">
            {assurances.map((item) => (
              <div key={item.title}>
                <dt>
                  <span aria-hidden="true" />
                  {item.title}
                </dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="automation-waitlist-form">
          <WaitlistForm />
        </div>
      </div>
    </section>
  );
}
