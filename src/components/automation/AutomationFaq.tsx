import Link from "next/link";

/**
 * FAQ and final call to action.
 *
 * The FAQ deliberately answers "when does it launch?" with the truth (we do not
 * know yet) rather than inventing a date. Questions here mirror the FAQPage
 * schema emitted by the page, so structured data matches visible content.
 */

export const automationFaqs = [
  {
    question: "When will Web Growth Automation launch?",
    answer:
      "We have not set a public launch date, and we would rather not invent one. Both products are in active development. Waitlist members hear first, and we will only announce a date once we are confident in it.",
  },
  {
    question: "What does joining the waitlist actually get me?",
    answer:
      "Product updates as the tools progress, and an early-access invitation before general availability. It is not a purchase and does not commit you to anything.",
  },
  {
    question: "Do I need a WhatsApp Business account already?",
    answer:
      "No. If you are interested in the WhatsApp platform, we will explain what is needed when early access opens. You do not have to prepare anything to join the waitlist.",
  },
  {
    question: "Can I sign up for just one of the two tools?",
    answer:
      "Yes. Choose WhatsApp Automation, TikTok Scheduler, or both. Your choice tells us what to prioritise and shapes the updates you receive.",
  },
  {
    question: "How much will it cost?",
    answer:
      "Pricing is not finalised, so we are not going to quote a figure we might change. We will share pricing with the waitlist before asking anyone to pay for anything.",
  },
  {
    question: "Is this affiliated with WhatsApp or TikTok?",
    answer:
      "No. Web Growth is an independent business. These are our own tools built to work with those platforms, and we are not endorsed by or affiliated with Meta or TikTok.",
  },
  {
    question: "What happens to my details?",
    answer:
      "They are stored securely and used to send Web Growth Automation updates and your early-access invitation. We do not sell them or add you to unrelated marketing. You can unsubscribe or ask for deletion at any time.",
  },
];

export default function AutomationFaq() {
  return (
    <>
      <section className="automation-section automation-faq" id="faq" aria-labelledby="automation-faq-title">
        <div className="automation-container automation-section-heading" data-automation-reveal>
          <div>
            <p className="automation-kicker">Questions</p>
            <h2 id="automation-faq-title">Straight answers, including the ones we cannot give yet.</h2>
          </div>
        </div>

        <div className="automation-container automation-faq-list" data-automation-reveal>
          {automationFaqs.map((faq) => (
            <details className="automation-faq-item" key={faq.question}>
              <summary>
                <span>{faq.question}</span>
                <span className="automation-faq-icon" aria-hidden="true" />
              </summary>
              <div className="automation-faq-answer">
                <p>{faq.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="automation-final" aria-labelledby="automation-final-title">
        <div className="automation-container automation-final-inner" data-automation-reveal>
          <p className="automation-kicker automation-kicker-invert">Currently in development</p>
          <h2 id="automation-final-title">
            Automate the work that slows your business down.
          </h2>
          <p>
            Join the waitlist and we will keep you posted as Web Growth Automation gets closer to
            launch. No payment details, no spam, and you can leave whenever you like.
          </p>
          <div className="automation-actions">
            <Link
              className="automation-button automation-button-invert"
              href="#waitlist"
              data-automation-cta="final"
            >
              Join the Waitlist
            </Link>
            <Link className="automation-button automation-button-quiet" href="/contact/">
              Talk to Web Growth
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
