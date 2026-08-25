/**
 * WhatsApp Business API section.
 *
 * The demo is a fixed, hand-written conversation rendered as real DOM text. It is
 * completely isolated from the production WhatsApp system: no import from
 * `src/lib/whatsapp/**`, no API route, no credentials, no message is ever sent.
 * The animation only reveals text that is already on the page, so with motion
 * disabled the whole exchange is readable at once.
 */

const capabilities = [
  {
    title: "Answer the repeat questions once",
    detail:
      "Set up replies for the things people ask every day (opening hours, prices, location, availability) so nobody waits for you to be free.",
  },
  {
    title: "Keep the whole team on one number",
    detail:
      "Conversations live in a shared inbox rather than on one person's phone, so cover during leave or a staff change stops being a problem.",
  },
  {
    title: "Know who you are talking to",
    detail:
      "Contacts, notes, and tags stay attached to the conversation, so the next reply starts with context instead of guesswork.",
  },
  {
    title: "Reach people who asked to hear from you",
    detail:
      "Send updates and offers to contacts who opted in, from a number they already recognise.",
  },
];

const conversation = [
  { from: "customer", text: "Hi, do you have the black one in size 42?" },
  { from: "system", text: "Auto-reply sent · tagged as product enquiry" },
  { from: "business", text: "Yes, size 42 is in stock. Want me to hold it for you today?" },
  { from: "customer", text: "Please do. I'll come by around 5." },
];

export default function WhatsAppSection() {
  return (
    <section
      className="automation-section automation-whatsapp"
      id="whatsapp"
      aria-labelledby="automation-whatsapp-title"
    >
      <div className="automation-container automation-split">
        <div className="automation-split-copy" data-automation-reveal>
          <p className="automation-kicker">WhatsApp Business API Platform</p>
          <h2 id="automation-whatsapp-title">
            Stop typing the same reply for the tenth time today.
          </h2>
          <p className="automation-section-lede">
            Most small businesses lose enquiries not because they ignore people, but because the
            messages arrive while they are busy doing the actual work. This is being built to close
            that gap.
          </p>

          <dl className="automation-feature-list">
            {capabilities.map((item) => (
              <div key={item.title}>
                <dt>{item.title}</dt>
                <dd>{item.detail}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="automation-split-visual" data-automation-reveal>
          <figure
            className="automation-chat"
            data-automation-demo="whatsapp_chat"
            aria-labelledby="automation-chat-caption"
          >
            <div className="automation-chat-head">
              <span className="automation-chat-avatar" aria-hidden="true" />
              <div>
                <p className="automation-chat-name">Customer enquiry</p>
                <p className="automation-chat-meta">Example conversation</p>
              </div>
            </div>

            <ol className="automation-chat-thread">
              {conversation.map((line, index) => (
                <li
                  key={line.text}
                  className={`automation-chat-line automation-chat-${line.from}`}
                  style={{ ["--line" as string]: String(index) }}
                >
                  {line.from === "system" ? (
                    <p className="automation-chat-system">
                      <span aria-hidden="true" />
                      {line.text}
                    </p>
                  ) : (
                    <p className="automation-chat-bubble">
                      <span className="automation-chat-who">
                        {line.from === "customer" ? "Customer" : "Your business"}
                      </span>
                      {line.text}
                    </p>
                  )}
                </li>
              ))}
            </ol>

            <figcaption id="automation-chat-caption" className="automation-figure-caption">
              An illustration of a planned WhatsApp workflow. Not a live conversation, and no message
              is sent from this page.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
