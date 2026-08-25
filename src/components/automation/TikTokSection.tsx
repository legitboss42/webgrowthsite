/**
 * TikTok Scheduler section.
 *
 * The demo is a fixed illustrative week of slots rendered as real DOM text. It is
 * completely isolated from the production scheduler: no import from
 * `src/lib/scheduler/**` or `src/lib/tiktok*`, no OAuth, no tokens, no queue, no
 * job, and nothing is ever posted. The animation only fills in slots that are
 * already present in the markup.
 */

const capabilities = [
  {
    title: "Plan the week in one sitting",
    detail:
      "Block out what goes live and when, so posting stops depending on remembering at the right moment.",
  },
  {
    title: "Prepare captions ahead of time",
    detail:
      "Write and review the caption while you are thinking about the content, not thirty seconds before it goes out.",
  },
  {
    title: "See the queue, not a list of reminders",
    detail: "A clear view of what is scheduled, what has gone out, and what still needs attention.",
  },
  {
    title: "Keep a record you can look back on",
    detail:
      "Each scheduled request is recorded, so you can see what you planned rather than reconstructing it.",
  },
];

const slots = [
  { day: "Mon", label: "Behind the scenes", state: "scheduled" },
  { day: "Tue", label: "Open slot", state: "empty" },
  { day: "Wed", label: "Customer question", state: "scheduled" },
  { day: "Thu", label: "Open slot", state: "empty" },
  { day: "Fri", label: "Product close-up", state: "scheduled" },
  { day: "Sat", label: "Weekend recap", state: "queued" },
];

export default function TikTokSection() {
  return (
    <section
      className="automation-section automation-tiktok"
      id="tiktok"
      aria-labelledby="automation-tiktok-title"
    >
      <div className="automation-container automation-split automation-split-reverse">
        <div className="automation-split-copy" data-automation-reveal>
          <p className="automation-kicker">TikTok Scheduler</p>
          <h2 id="automation-tiktok-title">
            Post consistently without living inside the app.
          </h2>
          <p className="automation-section-lede">
            Consistency is what makes short-form content work, and it is the first thing to slip when
            you are busy. This is being built so a planned week actually goes out as planned.
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
            className="automation-calendar"
            data-automation-demo="tiktok_calendar"
            aria-labelledby="automation-calendar-caption"
          >
            <div className="automation-calendar-head">
              <p className="automation-calendar-title">Content week</p>
              <p className="automation-calendar-meta">Example plan</p>
            </div>

            <ul className="automation-calendar-grid">
              {slots.map((slot, index) => (
                <li
                  key={slot.day}
                  className={`automation-slot automation-slot-${slot.state}`}
                  style={{ ["--slot" as string]: String(index) }}
                >
                  <p className="automation-slot-day">{slot.day}</p>
                  <p className="automation-slot-label">{slot.label}</p>
                  <p className="automation-slot-state">
                    {slot.state === "scheduled"
                      ? "Scheduled"
                      : slot.state === "queued"
                        ? "In queue"
                        : "Not planned"}
                  </p>
                </li>
              ))}
            </ul>

            <figcaption id="automation-calendar-caption" className="automation-figure-caption">
              An illustration of a planned scheduling view. Not connected to TikTok, and nothing is
              published from this page.
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
