import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { areas, homeServices } from "../content";
import { usePage } from "../components/Chrome";
import { PublicationCard, StoryCard } from "../components/Cards";
import { ReadingBar } from "../components/ReadingBar";
import { readBootstrap } from "../seo";
import { useReading } from "../reading";

function tilt(event) {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const el = event.currentTarget;
  const rect = el.getBoundingClientRect();
  const px = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const py = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  el.style.setProperty("--sx", `${event.clientX - rect.left}px`);
  el.style.setProperty("--sy", `${event.clientY - rect.top}px`);
  el.style.transform = `perspective(900px) rotateX(${(-py * 6).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg)`;
}

function untilt(event) {
  event.currentTarget.style.transform = "";
}

const emptyHome = { featured: [], reviews: [], opinions: [] };

export default function Home() {
  const reading = useReading();
  const { t } = reading;
  usePage(
    "Dr. Adil Zaman | Political Scientist, Researcher and Academic",
    "Dr. Adil Zaman researches elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia."
  );
  const [data, setData] = useState(() => {
    const cached = readBootstrap();
    return cached?.path === "/" && Array.isArray(cached.featured) ? cached : null;
  });

  useEffect(() => {
    api("/api/home")
      .then((payload) => setData({
        featured: Array.isArray(payload?.featured) ? payload.featured : [],
        reviews: Array.isArray(payload?.reviews) ? payload.reviews : [],
        opinions: Array.isArray(payload?.opinions) ? payload.opinions : [],
      }))
      .catch(() => setData(emptyHome));
  }, []);

  const featured = data?.featured || [];
  const reviews = data?.reviews || [];
  const opinions = data?.opinions || [];

  return (
    <>
      <section className="hero scene is-ready" data-scene="chamber">
        <div className="hero-stage">
          <div className="hero-intro">
            <p className="eyebrow">
              <span>Political Scientist</span>
              <span>Researcher</span>
              <span>Academic</span>
            </p>
            <h1>Dr. Adil Zaman</h1>
            <p className="hero-post">University of Gujrat</p>
          </div>
          <figure className="hero-portrait">
            <img src="/media/portrait.jpg" alt="Portrait of Dr. Adil Zaman" fetchPriority="high" decoding="async" />
            <figcaption>
              <strong>Dr. Adil Zaman</strong>
              <span>Political Science &amp; International Relations</span>
            </figcaption>
          </figure>
          <div className="hero-copy">
            <p className="statement">Researching elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia.</p>
            <p className="support">Empirical political research, survey analysis and comparative work on electoral processes, citizen behaviour and democratic institutions.</p>
            <div className="actions">
              <Link className="btn solid" to="/expertise">Explore Research</Link>
              <Link className="btn line" to="/publications">View Publications</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="band scene" data-scene="elections" aria-labelledby="areas-heading">
        <div className="frame">
          <header className="section-head">
            <p className="index">01</p>
            <h2 id="areas-heading">Research Areas</h2>
          </header>
          <div className="area-grid">
            {areas.map(([title, text], index) => (
              <article className="area-card" key={title} onPointerMove={tilt} onPointerLeave={untilt}>
                <p className="index">{String(index + 1).padStart(2, "0")}</p>
                <h3>{title}</h3>
                <p>{text}</p>
              </article>
            ))}
          </div>
          <p className="section-action"><Link className="btn line" to="/expertise">Explore Research Expertise</Link></p>
        </div>
      </section>

      <section className="band scene" data-scene="journals" aria-labelledby="featured-heading">
        <div className="frame">
          <header className="section-head" lang={reading.lang} dir={reading.dir}>
            <p className="index">02</p>
            <h2 id="featured-heading">{t.featured}</h2>
            <p>{t.homeFeatured}</p>
            <ReadingBar />
          </header>
          <div className="pub-list">
            {featured.map((item) => <PublicationCard key={item.id} item={item} />)}
          </div>
          <p className="section-action"><Link className="btn line" to="/publications" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.viewAllPublications}</Link></p>
        </div>
      </section>

      <section className="band scene" data-scene="reading" aria-labelledby="reviews-heading">
        <div className="frame">
          <header className="section-head" lang={reading.lang} dir={reading.dir}>
            <p className="index">03</p>
            <h2 id="reviews-heading">{t.reviews}</h2>
            <p>{t.homeReviews}</p>
            <ReadingBar />
          </header>
          <div className="story-grid">
            {reviews.map((article) => <StoryCard key={article.slug} article={article} kind="review" />)}
          </div>
          <p className="section-action"><Link className="btn line" to="/research-reviews" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.browseReviews}</Link></p>
        </div>
      </section>

      <section className="band scene" data-scene="editorial" aria-labelledby="opinion-heading">
        <div className="frame">
          <header className="section-head" lang={reading.lang} dir={reading.dir}>
            <p className="index">04</p>
            <h2 id="opinion-heading">{t.opinion}</h2>
            <p>{t.homeOpinion}</p>
            <ReadingBar />
          </header>
          <div className="story-grid">
            {opinions.map((article) => <StoryCard key={article.slug} article={article} kind="opinion" />)}
          </div>
          <p className="section-action"><Link className="btn line" to="/opinion-blogs" lang={reading.lang !== "en" ? reading.lang : undefined}>{t.viewOpinion}</Link></p>
        </div>
      </section>

      <section className="band scene" data-scene="seminar" aria-labelledby="services-heading">
        <div className="frame">
          <header className="section-head">
            <p className="index">05</p>
            <h2 id="services-heading">Research & Academic Services</h2>
            <p>Research support and academic consultancy for researchers, postgraduate students, academic institutions and organisations.</p>
          </header>
          <div className="service-grid">
            {homeServices.map(([title, href, text]) => (
              <Link className="service-card" to={href} key={title} onPointerMove={tilt} onPointerLeave={untilt}>
                <h3>{title}</h3>
                <p>{text}</p>
              </Link>
            ))}
          </div>
          <p className="section-action"><Link className="btn line" to="/services">Explore Services</Link></p>
        </div>
      </section>

      <section className="cta scene" data-scene="letters">
        <div className="frame">
          <div className="gold-rule" />
          <h2 id="cta-heading">Research, Collaboration and Academic Engagement</h2>
          <p>For research collaboration, academic consultation, invited lectures, research projects or professional enquiries, please get in touch.</p>
          <Link className="btn light" to="/contact">Contact Dr. Adil Zaman</Link>
        </div>
      </section>
    </>
  );
}
