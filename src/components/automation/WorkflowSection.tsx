/**
 * Unified workflow: how the two products are intended to connect.
 *
 * Framed as intent, not as a shipped capability, because neither product has
 * launched. Static markup; the connecting line animates in CSS only.
 */

const stages = [
  {
    label: "Content goes out",
    detail: "A scheduled TikTok post publishes on the day you planned it.",
    source: "TikTok Scheduler",
  },
  {
    label: "People reply",
    detail: "Viewers who want details message the business number instead of scrolling past.",
    source: "Your audience",
  },
  {
    label: "The reply is ready",
    detail: "Common questions get answered immediately, and the enquiry is tagged.",
    source: "WhatsApp platform",
  },
  {
    label: "You follow up",
    detail: "You step into a conversation that already has context, and close it properly.",
    source: "You",
  },
];

export default function WorkflowSection() {
  return (
    <section
      className="automation-section automation-workflow"
      id="workflow"
      aria-labelledby="automation-workflow-title"
    >
      <div className="automation-container automation-section-heading" data-automation-reveal>
        <div>
          <p className="automation-kicker">How they fit together</p>
          <h2 id="automation-workflow-title">
            Content brings people in. Automation makes sure someone answers.
          </h2>
          <p className="automation-section-lede">
            The two tools solve different halves of the same problem. This is the workflow we are
            building towards: content that goes out reliably, and enquiries that get a real reply.
          </p>
        </div>
      </div>

      <div className="automation-container" data-automation-reveal>
        <ol className="automation-track" data-automation-demo="unified_workflow">
          {stages.map((stage, index) => (
            <li
              className="automation-track-step"
              key={stage.label}
              style={{ ["--track" as string]: String(index) }}
            >
              <span className="automation-track-dot" aria-hidden="true" />
              <p className="automation-track-source">{stage.source}</p>
              <h3 className="automation-track-label">{stage.label}</h3>
              <p className="automation-track-detail">{stage.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
