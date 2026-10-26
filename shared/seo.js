export const ORIGIN = "https://zamanadil.com";

export const PROFILE = {
  name: "Dr. Adil Zaman",
  jobTitle: "Political Scientist",
  email: "adil.zaman@uog.edu.pk",
  affiliation: "University of Gujrat",
  department: "Department of Political Science and International Relations",
  description:
    "Dr. Adil Zaman researches elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia.",
  imagePath: "/media/portrait.png",
  knowsAbout: [
    "Elections",
    "Electoral integrity",
    "Political behaviour",
    "Democratic institutions",
    "Pakistan politics",
    "South Asian politics",
  ],
};

export const PAGES = {
  "/": {
    title: "Dr. Adil Zaman | Political Scientist, Researcher and Academic",
    description: PROFILE.description,
  },
  "/about": {
    title: "About",
    description:
      "Dr. Adil Zaman is a political scientist, researcher and academic specialising in elections, political behaviour, democratic institutions and South Asian politics.",
  },
  "/expertise": {
    title: "Research Expertise",
    description:
      "Research expertise in elections, voting behaviour, political participation, Pakistan politics, South Asia, parliament and quantitative political research.",
  },
  "/publications": {
    title: "Publications",
    description:
      "Academic publications by Dr. Adil Zaman on elections, political behaviour, democratic institutions, Pakistan politics and South Asian politics.",
  },
  "/research-reviews": {
    title: "Research Reviews",
    description:
      "Research reviews of academic studies in political science, electoral studies and related social sciences.",
  },
  "/opinion-blogs": {
    title: "Opinion & Blogs",
    description:
      "Evidence-informed commentary on contemporary political, social and international developments, with attention to Pakistan and South Asia.",
  },
  "/services": {
    title: "Research & Academic Services",
    description:
      "Research design, quantitative analysis, publication support, electoral data research and academic consultancy by Dr. Adil Zaman.",
  },
  "/contact": {
    title: "Contact",
    description:
      "Contact Dr. Adil Zaman about academic collaboration, research consultancy, invited lectures, research projects and publication enquiries.",
  },
  "/privacy": {
    title: "Privacy Policy",
    description: "How zamanadil.com handles contact enquiries and first-party page counts.",
  },
  "/disclaimer": {
    title: "Academic and Editorial Disclaimer",
    description: "Academic and editorial disclaimer for material published on zamanadil.com.",
  },
  "/accessibility": {
    title: "Accessibility",
    description: "Accessibility commitments for zamanadil.com.",
  },
};

export function clip(text, max = 158) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (value.length <= max) return value;
  const cut = value.slice(0, max - 1);
  const space = cut.lastIndexOf(" ");
  return `${(space > 80 ? cut.slice(0, space) : cut).trim()}…`;
}

export function documentTitle(title) {
  const raw = String(title || PROFILE.name).replace(/\s+/g, " ").trim();
  const branded = /Dr\.?\s+Adil/i.test(raw) ? raw : `${raw} · ${PROFILE.name}`;
  const chosen = branded.length <= 70 ? branded : raw;
  if (chosen.length <= 70) return chosen;
  const cut = chosen.slice(0, 67);
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}

export function absoluteUrl(pathOrUrl) {
  const value = String(pathOrUrl || "/");
  if (/^https?:\/\//i.test(value)) return value;
  return `${ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

export function robotsFor(path) {
  if (path === "/search" || path.startsWith("/admin")) return "noindex, nofollow";
  return "index, follow";
}

function personNode() {
  return {
    "@type": "Person",
    "@id": `${ORIGIN}/#person`,
    name: PROFILE.name,
    jobTitle: PROFILE.jobTitle,
    email: PROFILE.email,
    url: `${ORIGIN}/about`,
    image: absoluteUrl(PROFILE.imagePath),
    worksFor: {
      "@type": "CollegeOrUniversity",
      name: PROFILE.affiliation,
      department: {
        "@type": "Organization",
        name: PROFILE.department,
      },
    },
    knowsAbout: PROFILE.knowsAbout,
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${ORIGIN}/#website`,
    name: PROFILE.name,
    url: `${ORIGIN}/`,
    description: PROFILE.description,
    publisher: { "@id": `${ORIGIN}/#person` },
    potentialAction: {
      "@type": "SearchAction",
      target: `${ORIGIN}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function pageGraph({ title, description, path, extra = [] }) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      personNode(),
      websiteNode(),
      {
        "@type": "WebPage",
        "@id": `${absoluteUrl(path)}#webpage`,
        url: absoluteUrl(path),
        name: documentTitle(title),
        description: clip(description),
        isPartOf: { "@id": `${ORIGIN}/#website` },
        about: { "@id": `${ORIGIN}/#person` },
        inLanguage: "en",
      },
      ...extra,
    ],
  };
}

export function breadcrumbNode(items) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function articleNode(article, path) {
  return {
    "@type": article.kind === "review" ? "Review" : "BlogPosting",
    "@id": `${absoluteUrl(path)}#article`,
    headline: article.title,
    description: clip(article.excerpt || article.subtitle || article.title),
    datePublished: article.date,
    inLanguage: article.alt?.lang
      ? [article.lang === "ur" ? "ur" : "en", article.alt.lang === "ur" ? "ur" : "en"]
      : (article.lang === "ur" ? "ur" : "en"),
    image: absoluteUrl(article.image || PROFILE.imagePath),
    author: { "@id": `${ORIGIN}/#person` },
    publisher: { "@id": `${ORIGIN}/#person` },
    mainEntityOfPage: absoluteUrl(path),
    articleSection: article.category || undefined,
    ...(article.doi ? { sameAs: `https://doi.org/${String(article.doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, "")}` } : {}),
  };
}

function authorNodes(authors) {
  const normalized = String(authors || PROFILE.name).replace(/\s+&\s+/g, ", ");
  const matches = normalized.match(/[^,]+,\s*[^,]+/g);
  const names = (matches || [normalized]).map((name) => name.trim()).filter(Boolean);
  return names.map((name) => (
    /zaman/i.test(name)
      ? { "@type": "Person", name, "@id": `${ORIGIN}/#person` }
      : { "@type": "Person", name }
  ));
}

export function scholarlyNode(item) {
  const path = `/publications/${item.id || item.slug}`;
  const doi = String(item.doi || "").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const sameAs = doi ? `https://doi.org/${doi}` : item.url || item.link || undefined;
  return {
    "@type": "ScholarlyArticle",
    "@id": `${absoluteUrl(path)}#publication`,
    headline: item.title,
    name: item.title,
    author: authorNodes(item.authors),
    datePublished: String(item.year || ""),
    inLanguage: item.alt?.lang ? [item.lang === "ur" ? "ur" : "en", item.alt.lang === "ur" ? "ur" : "en"] : (item.lang === "ur" ? "ur" : "en"),
    description: clip(item.summary || `${item.authors}. ${item.venue}, ${item.year}.`),
    isPartOf: item.venue ? { "@type": "Periodical", name: item.venue } : undefined,
    publisher: item.venue ? { "@type": "Organization", name: item.venue } : undefined,
    sameAs,
    url: absoluteUrl(path),
  };
}

export function itemListNode(items, hrefFor) {
  return {
    "@type": "ItemList",
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.title,
      url: absoluteUrl(hrefFor(item)),
    })),
  };
}
