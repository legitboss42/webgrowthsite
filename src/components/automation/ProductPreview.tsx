/**
 * Product preview: the two tools under the Web Growth Automation umbrella.
 *
 * Static server component. Status text is deliberately pre-launch only:
 * dates, no availability claims, no pricing.
 */

const products = [
  {
    id: "whatsapp",
    eyebrow: "In development",
    name: "WhatsApp Business API Platform",
    summary:
      "One place to handle customer conversations, contacts, and follow-up instead of scrolling a personal phone.",
    points: [
      "Shared inbox so a team answers from one number",
      "Saved replies for the questions you answer daily",
      "Contacts and tags that survive staff changes",
      "Campaign sending to people who opted in",
    ],
    href: "#whatsapp",
  },
  {
    id: "tiktok",
    eyebrow: "In development",
    name: "TikTok Scheduler",
    summary:
      "Plan a week of content in one sitting, then let the queue handle publishing at the times you chose.",
    points: [
      "A calendar view of what goes out and when",
      "Upload and caption ahead of time",
      "A visible queue instead of phone reminders",
      "A clear record of what was scheduled",
    ],
    href: "#tiktok",
  },
];

export default function ProductPreview() {
  return (
    <section className="automation-section automation-products" id="products" aria-labelledby="automation-products-title">
      <div className="automation-container automation-section-heading" data-automation-reveal>
        <div>
          <p className="automation-kicker">Two tools, one platform</p>
          <h2 id="automation-products-title">
            Built around the two jobs small teams keep doing by hand.
          </h2>
          <p className="automation-section-lede">
            Web Growth Automation is the umbrella for both products. They are being built to work on
            their own, and to work better together.
          </p>
        </div>
      </div>

      <div className="automation-container automation-product-grid">
        {products.map((product) => (
          <article
            className="automation-product-card"
            key={product.id}
            data-automation-reveal
            aria-labelledby={`automation-product-${product.id}`}
          >
            <p className="automation-status-pill">
              <span aria-hidden="true" />
              {product.eyebrow}
            </p>
            <h3 id={`automation-product-${product.id}`}>{product.name}</h3>
            <p className="automation-product-summary">{product.summary}</p>
            <ul className="automation-check-list">
              {product.points.map((point) => (
                <li key={point}>
                  <span aria-hidden="true" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <a className="automation-text-link" href={product.href}>
              How it will work
              <span aria-hidden="true"> &rarr;</span>
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
