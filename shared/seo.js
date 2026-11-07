export const ORIGIN = "https://zamanadil.com";

export const SOCIAL = {
  path: "/media/og-image.jpg",
  width: 1200,
  height: 630,
  type: "image/jpeg",
  alt: "Dr. Adil Zaman, political scientist at the University of Gujrat",
};

export const PROFILE = {
  name: "Dr. Adil Zaman",
  jobTitle: "Political Scientist",
  email: "adil.zaman@uog.edu.pk",
  telephone: "+92-53-2260000",
  telephoneExtension: "5062",
  affiliation: "University of Gujrat",
  affiliationUrl: "https://uog.edu.pk",
  department: "Department of Political Science and International Relations",
  description:
    "Dr. Adil Zaman researches elections, political behaviour, democratic institutions and the changing politics of Pakistan and South Asia.",
  imagePath: "/media/portrait.jpg",
  profiles: [
    "https://uog.edu.pk/faculty/ynj57cea53c00c28/adil-zaman",
    "https://scholar.google.com/citations?user=PKR-O14AAAAJ",
    "https://www.linkedin.com/in/adil-zaman-0a750060",
  ],
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
    title: "Dr. Adil Zaman | Political Scientist and Researcher",
    description: PROFILE.description,
  },
  "/about": {
    title: "About Dr. Adil Zaman | Political Scientist & Researcher",
    description:
      "Dr. Adil Zaman is a political scientist, researcher and academic specialising in elections, political behaviour, democratic institutions and South Asian politics.",
  },
  "/expertise": {
    title: "Research Expertise",
    description:
      "Research expertise in elections, voting behaviour, political participation, Pakistan politics, South Asia, parliament and quantitative political research.",
  },
  "/publications": {
    title: "Publications by Dr. Adil Zaman | Political Science Research",
    description:
      "Academic publications by Dr. Adil Zaman on elections, political behaviour, democratic institutions, Pakistan politics and South Asian politics.",
  },
  "/current-projects": {
    title: "Current Projects",
    description:
      "Current research and academic projects by Dr. Adil Zaman on elections, political behaviour, democratic institutions and South Asian politics.",
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
    title: "Contact Dr. Adil Zaman | Research & Academic Enquiries",
    description:
      "Contact Dr. Adil Zaman about academic collaboration, research consultancy, invited lectures, research projects and publication enquiries.",
  },
  "/privacy": {
    title: "Privacy Notice",
    description:
      "How personal information is collected, used, kept, and disclosed on zamanadil.com, and how to ask for access or deletion.",
  },
  "/disclaimer": {
    title: "Academic and Editorial Disclaimer",
    description:
      "The standing of research, reviews, opinion, translations, and described services published on zamanadil.com.",
  },
  "/accessibility": {
    title: "Accessibility Statement",
    description:
      "The accessibility aim for zamanadil.com, the limits that are known, and how to report a barrier.",
  },
  "/terms": {
    title: "Terms",
    description: "Terms of use for zamanadil.com, set out in the academic and editorial disclaimer.",
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
  const chosen = branded.length <= 60 ? branded : raw;
  if (chosen.length <= 60) return chosen;
  const cut = chosen.slice(0, 57);
  const space = cut.lastIndexOf(" ");
  return `${(space > 40 ? cut.slice(0, space) : cut).trim()}…`;
}

export function absoluteUrl(pathOrUrl) {
  const value = String(pathOrUrl || "/");
  if (/^https?:\/\//i.test(value)) return value;
  return `${ORIGIN}${value.startsWith("/") ? value : `/${value}`}`;
}

export function localeFor(lang) {
  return lang === "ur" ? "ur_PK" : "en_US";
}

export function contentLanguages(...values) {
  const codes = [];
  for (const value of values.flat()) {
    const code = value === "ur" ? "ur" : value === "en" ? "en" : "";
    if (code && !codes.includes(code)) codes.push(code);
  }
  return codes;
}

export function alternateLocales(lang, languages = []) {
  const current = localeFor(lang === "ur" ? "ur" : "en");
  return contentLanguages(languages)
    .map(localeFor)
    .filter((item) => item !== current);
}

export function socialFields(image, imageAlt) {
  const url = absoluteUrl(image || SOCIAL.path);
  const branded = url === absoluteUrl(SOCIAL.path);
  const type = branded
    ? SOCIAL.type
    : url.endsWith(".png")
      ? "image/png"
      : url.endsWith(".webp")
        ? "image/webp"
        : url.endsWith(".jpg") || url.endsWith(".jpeg")
          ? "image/jpeg"
          : "";
  return {
    url,
    alt: imageAlt || (branded ? SOCIAL.alt : ""),
    width: branded ? String(SOCIAL.width) : "",
    height: branded ? String(SOCIAL.height) : "",
    type,
    secureUrl: url.startsWith("https://") ? url : "",
  };
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
      url: PROFILE.affiliationUrl,
      department: {
        "@type": "Organization",
        name: PROFILE.department,
      },
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Gujrat",
      addressCountry: "PK",
    },
    contactPoint: {
      "@type": "ContactPoint",
      email: PROFILE.email,
      contactType: "academic",
      availableLanguage: ["English", "Urdu"],
    },
    knowsAbout: PROFILE.knowsAbout,
    knowsLanguage: ["en", "ur"],
    sameAs: PROFILE.profiles,
  };
}

function organizationNode() {
  return {
    "@type": "Organization",
    "@id": `${ORIGIN}/#organization`,
    name: PROFILE.name,
    url: `${ORIGIN}/`,
    description: PROFILE.description,
    email: PROFILE.email,
    telephone: `${PROFILE.telephone};ext=${PROFILE.telephoneExtension}`,
    logo: {
      "@type": "ImageObject",
      url: absoluteUrl("/media/logo.jpg"),
    },
    image: absoluteUrl(PROFILE.imagePath),
    address: {
      "@type": "PostalAddress",
      streetAddress: "Hafiz Hayat Campus",
      addressLocality: "Gujrat",
      addressRegion: "Punjab",
      addressCountry: "PK",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "academic enquiries",
      email: PROFILE.email,
      telephone: `${PROFILE.telephone};ext=${PROFILE.telephoneExtension}`,
      url: `${ORIGIN}/contact`,
      availableLanguage: ["English", "Urdu"],
    },
    sameAs: PROFILE.profiles,
  };
}

function websiteNode() {
  return {
    "@type": "WebSite",
    "@id": `${ORIGIN}/#website`,
    name: PROFILE.name,
    url: `${ORIGIN}/`,
    description: PROFILE.description,
    publisher: { "@id": `${ORIGIN}/#organization` },
    inLanguage: ["en", "ur"],
  };
}

function pageType(path) {
  if (path === "/about") return "ProfilePage";
  if (path === "/contact") return "ContactPage";
  if (path === "/search") return "SearchResultsPage";
  return "WebPage";
}

export function pageGraph({ title, description, path, lang = "en", image, extra = [] }) {
  const page = {
    "@type": pageType(path),
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: documentTitle(title),
    description: clip(description),
    isPartOf: { "@id": `${ORIGIN}/#website` },
    about: { "@id": `${ORIGIN}/#person` },
    inLanguage: lang === "ur" ? "ur" : "en",
  };
  if (path === "/" || path === "/about") page.mainEntity = { "@id": `${ORIGIN}/#person` };
  const picture = image
    ? absoluteUrl(image)
    : path === "/" || path === "/about"
      ? absoluteUrl(PROFILE.imagePath)
      : "";
  if (picture) {
    page.primaryImageOfPage = {
      "@type": "ImageObject",
      url: picture,
      ...(picture === absoluteUrl(PROFILE.imagePath) ? { caption: "Portrait of Dr. Adil Zaman" } : {}),
      ...(picture === absoluteUrl(SOCIAL.path)
        ? { width: SOCIAL.width, height: SOCIAL.height, caption: SOCIAL.alt }
        : {}),
    };
  }
  return {
    "@context": "https://schema.org",
    "@graph": [organizationNode(), personNode(), websiteNode(), page, ...extra],
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
    ...(article.updatedAt ? { dateModified: article.updatedAt } : {}),
    inLanguage: article.alt?.lang
      ? [article.lang === "ur" ? "ur" : "en", article.alt.lang === "ur" ? "ur" : "en"]
      : (article.lang === "ur" ? "ur" : "en"),
    image: absoluteUrl(article.image || SOCIAL.path),
    author: { "@id": `${ORIGIN}/#person` },
    publisher: { "@id": `${ORIGIN}/#person` },
    mainEntityOfPage: { "@id": `${absoluteUrl(path)}#webpage` },
    isAccessibleForFree: true,
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
    ...(item.updatedAt ? { dateModified: item.updatedAt } : {}),
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
