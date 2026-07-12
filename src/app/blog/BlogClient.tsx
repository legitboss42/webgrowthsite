import Image from "next/image";
import Link from "next/link";
import ClarityPageTags from "@/components/analytics/ClarityPageTags";
import EditorialTrustNote from "@/components/EditorialTrustNote";
import {
  AuditIcon,
  CapIcon,
  CodeWindowIcon,
  DollarIcon,
  GrowthChartIcon,
  MonetizeIcon,
  SearchIcon,
  ShieldIcon,
  SpeedIcon,
} from "@/components/home/HomeIcons";
import { NEW_SERVICES_LIST } from "@/lib/newServiceConfigs";
import { CONTACT_EMAIL, CONTACT_EMAIL_HREF } from "@/lib/site";
import { PUBLIC_TOOLS } from "@/lib/tools";

type BlogPostPreview = {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  tags: string[];
  readTime: string;
  cover?: string;
};

type Props = { posts: BlogPostPreview[] };

const FALLBACK_COVER = "/images/hero/Hero-Image-1.webp";

const topics = [
  { title: "SEO", text: "Search visibility, technical foundations, and local discovery.", icon: <SearchIcon />, slugs: ["small-business-website-seo-checklist", "local-seo-for-small-business-google-maps-ranking-guide", "03-seo-migration-without-losing-traffic"] },
  { title: "Web Design", text: "Structure, messaging, credibility, and conversion journeys.", icon: <CodeWindowIcon />, slugs: ["how-to-build-a-small-business-website-that-converts", "homepage-structure-that-converts-visitors-into-customers", "high-converting-service-page"] },
  { title: "Performance", text: "Speed, Core Web Vitals, hosting, and technical stability.", icon: <SpeedIcon />, slugs: ["how-to-make-your-website-load-fast", "how-to-audit-slow-wordpress-site", "05-premium-design-without-slow-pages"] },
  { title: "Lead Generation", text: "Landing pages, buyer clarity, enquiries, and nurturing.", icon: <GrowthChartIcon />, slugs: ["high-converting-landing-pages-guide", "landing-page-wireframe-local-service-business", "conversion-audit-checklist-service-homepage"] },
  { title: "Monetization", text: "Responsible revenue systems that protect trust and usefulness.", icon: <DollarIcon />, slugs: ["why-your-website-isnt-getting-leads", "email-marketing-for-small-business", "email-automation-architecture"] },
  { title: "Case Studies", text: "First-hand rebuild decisions, tradeoffs, and lessons.", icon: <AuditIcon />, slugs: ["jluxe-medical-aesthetics-case-study", "01-why-we-rebuilt-not-redesigned", "08-results-mistakes-and-reusable-playbook"] },
] as const;

const paths = [
  { number: "01", title: "Start and launch", text: "Build the foundation, launch plan, and first conversion path.", href: "/blog/how-to-build-a-small-business-website-that-converts/", icon: <CapIcon /> },
  { number: "02", title: "Rank and attract", text: "Strengthen search structure and move toward qualified traffic.", href: "/blog/small-business-website-seo-checklist/", icon: <SearchIcon /> },
  { number: "03", title: "Convert and monetize", text: "Improve lead quality and create responsible revenue paths.", href: "/blog/why-your-website-isnt-getting-leads/", icon: <MonetizeIcon /> },
  { number: "04", title: "Optimize and scale", text: "Improve speed, tracking, and operating discipline.", href: "/blog/how-to-make-your-website-load-fast/", icon: <ShieldIcon /> },
] as const;

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function BlogClient({ posts }: Props) {
  const featured = posts.find((post) => post.slug === "how-to-build-a-small-business-website-that-converts") ?? posts[0];
  const caseStudy = posts.find((post) => post.slug === "jluxe-medical-aesthetics-case-study");
  const latest = posts.filter((post) => post.slug !== featured?.slug).slice(0, 6);
  const availableSlugs = new Set(posts.map((post) => post.slug));
  const categoryCount = new Set(posts.map((post) => post.category)).size;

  return (
    <main className="academy-page">
      <ClarityPageTags tags={{ page_type: "blog_index", content_group: "academy" }} />

      <section className="academy-hero">
        <div className="academy-glow academy-glow-one" />
        <div className="academy-glow academy-glow-two" />
        <div className="academy-container academy-hero-grid">
          <div className="academy-hero-copy">
            <p className="academy-kicker">Web Growth Academy</p>
            <h1>Learn how better websites <em>build better businesses.</em></h1>
            <p className="academy-lede">Practical field notes on web design, SEO, performance, conversion, and responsible monetization—written to help you make stronger decisions before you spend.</p>
            <div className="academy-actions">
              {featured ? <Link className="academy-button academy-button-primary" href={`/blog/${featured.slug}/`}>Start with the featured guide <span aria-hidden="true">→</span></Link> : null}
              <Link className="academy-button academy-button-secondary" href="#academy-library">Browse the library</Link>
            </div>
          </div>
          <aside className="academy-hero-note" aria-label="Academy editorial promise">
            <span>Built for implementation</span>
            <strong>Clear thinking before expensive execution.</strong>
            <p>Every guide answers a real website-growth question, explains the tradeoffs, and connects learning to an honest next step.</p>
            <dl>
              <div><dt>{posts.length}</dt><dd>published guides</dd></div>
              <div><dt>{categoryCount}</dt><dd>active categories</dd></div>
              <div><dt>{PUBLIC_TOOLS.length}</dt><dd>public tools</dd></div>
            </dl>
          </aside>
        </div>
      </section>

      {featured ? (
        <section className="academy-featured">
          <div className="academy-container academy-featured-grid">
            <Link className="academy-featured-image" href={`/blog/${featured.slug}/`} aria-label={`Read ${featured.title}`}>
              <Image src={featured.cover || FALLBACK_COVER} alt={featured.title} fill priority sizes="(max-width: 900px) 100vw, 58vw" />
            </Link>
            <article className="academy-featured-copy">
              <p className="academy-kicker">Editor’s selection / {featured.category}</p>
              <h2>{featured.title}</h2>
              <p>{featured.excerpt}</p>
              <div className="academy-meta"><span>{formatDate(featured.date)}</span><span>{featured.readTime}</span></div>
              <Link className="academy-text-link" href={`/blog/${featured.slug}/`}>Read the guide <span aria-hidden="true">→</span></Link>
            </article>
          </div>
        </section>
      ) : null}

      <section className="academy-trust">
        <div className="academy-container"><EditorialTrustNote /></div>
      </section>

      <section className="academy-topics" id="academy-topics">
        <div className="academy-container">
          <header className="academy-section-heading">
            <div><p className="academy-kicker">Explore by discipline</p><h2>Find the problem you need to solve next.</h2></div>
            <p>Not a feed designed to keep you scrolling. A structured library designed to help you act.</p>
          </header>
          <div className="academy-topic-list">
            {topics.map((topic, index) => {
              const liveSlugs = topic.slugs.filter((slug) => availableSlugs.has(slug));
              return (
                <Link key={topic.title} href={liveSlugs[0] ? `/blog/${liveSlugs[0]}/` : "/blog/"}>
                  <span className="academy-topic-number">0{index + 1}</span>
                  <span className="academy-topic-icon">{topic.icon}</span>
                  <span><strong>{topic.title}</strong><small>{topic.text}</small></span>
                  <span className="academy-topic-count">{liveSlugs.length} guides</span>
                  <span className="academy-topic-arrow" aria-hidden="true">↗</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="academy-paths">
        <div className="academy-container academy-paths-grid">
          <header><p className="academy-kicker">Learning paths</p><h2>Follow the website growth journey.</h2><p>Move through the Academy by business stage—from building credibility to attracting traffic, converting visitors, and scaling what works.</p></header>
          <div className="academy-path-list">
            {paths.map((path) => (
              <Link key={path.title} href={path.href}>
                <span className="academy-path-icon">{path.icon}</span>
                <span className="academy-path-number">{path.number}</span>
                <strong>{path.title}</strong>
                <small>{path.text}</small>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="academy-library" id="academy-library">
        <div className="academy-container">
          <header className="academy-section-heading">
            <div><p className="academy-kicker">Latest from the Academy</p><h2>Recent guides and field notes.</h2></div>
            <Link className="academy-text-link" href="/editorial-policy/">How we research and review <span aria-hidden="true">→</span></Link>
          </header>
          <div className="academy-article-grid">
            {latest.map((post, index) => (
              <article key={post.slug} className={index === 0 ? "academy-article academy-article-wide" : "academy-article"}>
                <Link className="academy-article-image" href={`/blog/${post.slug}/`}>
                  <Image src={post.cover || FALLBACK_COVER} alt={post.title} fill sizes={index === 0 ? "(max-width: 900px) 100vw, 50vw" : "(max-width: 900px) 100vw, 33vw"} />
                </Link>
                <div className="academy-article-body">
                  <div className="academy-meta"><span>{post.category}</span><span>{post.readTime}</span></div>
                  <h3><Link href={`/blog/${post.slug}/`}>{post.title}</Link></h3>
                  <p>{post.excerpt}</p>
                  <Link className="academy-text-link" href={`/blog/${post.slug}/`}>Read article <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {caseStudy ? (
        <section className="academy-case-study">
          <div className="academy-container academy-case-grid">
            <div><p className="academy-kicker">Case study / First-hand work</p><h2>See the decisions behind a real website rebuild.</h2><p>{caseStudy.excerpt}</p><Link className="academy-button academy-button-primary" href={`/blog/${caseStudy.slug}/`}>Read the J Luxe case study <span aria-hidden="true">→</span></Link></div>
            <div className="academy-case-steps"><span>Audit the experience</span><span>Define the strategy</span><span>Build the system</span><span>Review the outcome honestly</span></div>
          </div>
        </section>
      ) : null}

      <section className="academy-connections">
        <div className="academy-container academy-connections-grid">
          <div><p className="academy-kicker">From learning to action</p><h2>Use the right next step for the job.</h2></div>
          <div className="academy-connection-links">
            <Link href="/tools/"><span>Free tools</span><strong>{PUBLIC_TOOLS.length} live tools for practical checks</strong><small>Open the tools library →</small></Link>
            <Link href="/services/"><span>Implementation</span><strong>{NEW_SERVICES_LIST.length} services for hands-on execution</strong><small>Explore services →</small></Link>
            <Link href="/contact/"><span>Direct support</span><strong>Discuss a real website and its priorities</strong><small>Request a review →</small></Link>
          </div>
        </div>
      </section>

      <section className="academy-final">
        <div className="academy-container academy-final-inner">
          <div><p className="academy-kicker">Stay close to the work</p><h2>Get practical website growth guidance.</h2><p>The newsletter is being introduced carefully. Until it is live, request updates through the contact route or email Web Growth directly.</p></div>
          <div className="academy-actions"><Link className="academy-button academy-button-primary" href="/contact/">Request updates</Link><Link className="academy-button academy-button-secondary" href={CONTACT_EMAIL_HREF}>Email {CONTACT_EMAIL}</Link></div>
        </div>
      </section>
    </main>
  );
}
