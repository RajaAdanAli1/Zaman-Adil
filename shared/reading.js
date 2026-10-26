import { READING_LANGS } from "./catalog.js";
import { languageByCode } from "./languages.js";

const NAV_KEYS = {
  "/publications": "publications",
  "/research-reviews": "reviews",
  "/opinion-blogs": "opinion",
};

const CATEGORIES = {
  Elections: "انتخابات",
  "Electoral Integrity": "انتخابی سالمیت",
  "Voting Behaviour": "ووٹنگ کا رویہ",
  "Political Participation": "سیاسی شرکت",
  Democracy: "جمہوریت",
  "Political Institutions": "سیاسی ادارے",
  Pakistan: "پاکستان",
  "South Asia": "جنوبی ایشیا",
  "Research Methods": "تحقیقی طریقے",
  Politics: "سیاست",
  Society: "معاشرہ",
  Economy: "معیشت",
  "International Affairs": "بین الاقوامی امور",
  Culture: "ثقافت",
  Geography: "جغرافیہ",
};

const TYPE_HEADINGS = {
  en: {
    "Journal Article": "Journal Articles",
    "Book Chapter": "Book Chapters",
    "Research Report": "Research Reports",
    "Conference Paper": "Conference Papers",
    "Working Paper": "Working Papers",
  },
  ur: {
    "Journal Article": "تحقیقی مقالے",
    "Book Chapter": "کتابی ابواب",
    "Research Report": "تحقیقی رپورٹس",
    "Conference Paper": "کانفرنس مقالے",
    "Working Paper": "ورکنگ پیپرز",
  },
};

export const copy = {
  en: {
    publications: "Publications",
    reviews: "Research Reviews",
    opinion: "Opinion & Blogs",
    featured: "Featured Research",
    archive: "Archive",
    commentary: "Commentary",
    reviewsEyebrow: "Reviews",
    all: "All",
    allYears: "All years",
    allTypes: "All types",
    readReview: "Read Review",
    readArticle: "Read Article",
    continueReading: "Continue reading",
    reviewedStudy: "Reviewed study",
    source: "Source",
    publisherRecord: "Publisher record",
    viewPublication: "View publication",
    verified: "Verified record",
    pdf: "PDF",
    downloadBib: "Download BibTeX",
    language: "Reading language",
    textSize: "Text size",
    smaller: "Smaller text",
    larger: "Larger text",
    originalNote: "This language is not on the record yet. The original language is shown.",
    bothLanguages: "Available in English and Urdu",
    viewAllPublications: "View All Publications",
    browseReviews: "Browse Research Reviews",
    viewOpinion: "View Opinion & Blogs",
    backToPublications: "Back to publications",
    loading: "Loading…",
    notFoundPublication: "This publication could not be found.",
    notFoundPage: "This page could not be found.",
    emptyPublications: "No publications match this filter.",
    categories: "Categories",
    filterPublications: "Filter publications",
    filterTypes: "Filter by type",
    home: "Home",
    typePublication: "Publication",
    typeReview: "Research Review",
    typeOpinion: "Opinion",
    pubMeta: "Academic publications by Dr. Adil Zaman on elections, political behaviour, democratic institutions, Pakistan politics and South Asian politics.",
    pubLede: "Academic publications and scholarly work in political science, electoral studies, political behaviour, Pakistan politics and South Asian politics.",
    pubNote: "Each title opens a record on this site. The publisher, DOI or full text is linked from that record.",
    reviewMeta: "Research reviews of academic studies in political science, electoral studies and related social sciences.",
    reviewLede: "Each review explains a study’s central argument, methodology and findings, then considers its significance for further research and for Pakistan and South Asia.",
    opinionMeta: "Evidence-informed commentary on contemporary political, social and international developments, with attention to Pakistan and South Asia.",
    opinionLede: "Evidence-informed commentary on contemporary political, social, economic and international developments, with particular attention to Pakistan and South Asia.",
    homeFeatured: "Selected publications on elections, political behaviour, democratic institutions and political developments in Pakistan and South Asia. Each title opens its record on this site, with a link to the publisher.",
    homeReviews: "Research Reviews examines important academic studies in political science, electoral studies and related social sciences. Each review explains a study’s central argument, methodology and findings while considering its wider significance.",
    homeOpinion: "Opinion & Blogs provides evidence-informed commentary on contemporary political, social, economic and international developments, with particular attention to Pakistan and South Asia.",
    liveNote: "Where this language is not already written, a live translation is shown. The published text is unchanged.",
    translating: "Translating…",
    translateFailed: "This language could not be translated just now. The original text is shown.",
    searchLanguages: "Search languages",
    languageList: "Languages",
    noLanguage: "No language matches",
    suggested: "Suggested",
    allLanguages: "All languages",
    minReadTemplate: "{n} min read",
    countOne: "{n} publication",
    countMany: "{n} publications",
    minRead: (count) => `${count} min read`,
    count: (count) => `${count} publication${count === 1 ? "" : "s"}`,
  },
  ur: {
    publications: "اشاعتیں",
    reviews: "تحقیقی جائزے",
    opinion: "رائے اور بلاگز",
    featured: "نمایاں تحقیق",
    archive: "محفوظہ",
    commentary: "تبصرہ",
    reviewsEyebrow: "جائزے",
    all: "تمام",
    allYears: "تمام سال",
    allTypes: "تمام اقسام",
    readReview: "جائزہ پڑھیں",
    readArticle: "مضمون پڑھیں",
    continueReading: "پڑھنا جاری رکھیں",
    reviewedStudy: "زیرِ جائزہ مطالعہ",
    source: "ماخذ",
    publisherRecord: "ناشر کا ریکارڈ",
    viewPublication: "اشاعت دیکھیں",
    verified: "تصدیق شدہ ریکارڈ",
    pdf: "پی ڈی ایف",
    downloadBib: "BibTeX ڈاؤن لوڈ کریں",
    language: "زبانِ مطالعہ",
    textSize: "متن کا سائز",
    smaller: "چھوٹا متن",
    larger: "بڑا متن",
    originalNote: "اس ریکارڈ پر یہ زبان ابھی موجود نہیں۔ اصل زبان دکھائی جا رہی ہے۔",
    bothLanguages: "انگریزی اور اردو میں دستیاب",
    viewAllPublications: "تمام اشاعتیں دیکھیں",
    browseReviews: "تحقیقی جائزے دیکھیں",
    viewOpinion: "رائے اور بلاگز دیکھیں",
    backToPublications: "اشاعتوں پر واپس جائیں",
    loading: "لوڈ ہو رہا ہے…",
    notFoundPublication: "یہ اشاعت نہیں ملی۔",
    notFoundPage: "یہ صفحہ نہیں ملا۔",
    emptyPublications: "اس انتخاب سے کوئی اشاعت نہیں ملی۔",
    categories: "زمرے",
    filterPublications: "اشاعتوں کی چھانٹی",
    filterTypes: "قسم کے لحاظ سے چھانٹی",
    home: "مرکزی صفحہ",
    typePublication: "اشاعت",
    typeReview: "تحقیقی جائزہ",
    typeOpinion: "رائے",
    pubMeta: "ڈاکٹر عادل زمان کی علمی اشاعتیں: انتخابات، سیاسی رویہ، جمہوری ادارے، پاکستان کی سیاست اور جنوبی ایشیا کی سیاست۔",
    pubLede: "سیاسیات، انتخابی مطالعات، سیاسی رویے، پاکستان کی سیاست اور جنوبی ایشیا کی سیاست پر علمی اشاعتیں اور تحقیقی کام۔",
    pubNote: "ہر عنوان اس ویب سائٹ پر اپنا ریکارڈ کھولتا ہے۔ ناشر، ڈی او آئی یا مکمل متن اسی ریکارڈ سے منسلک ہے۔",
    reviewMeta: "سیاسیات، انتخابی مطالعات اور متعلقہ سماجی علوم کے علمی مطالعات کے تحقیقی جائزے۔",
    reviewLede: "ہر جائزہ مطالعے کے مرکزی استدلال، طریقۂ کار اور نتائج کی وضاحت کرتا ہے، پھر مزید تحقیق اور پاکستان و جنوبی ایشیا کے لیے اس کی اہمیت پر غور کرتا ہے۔",
    opinionMeta: "معاصر سیاسی، سماجی اور بین الاقوامی صورتِ حال پر شواہد سے آگاہ تبصرہ، پاکستان اور جنوبی ایشیا کے تناظر میں۔",
    opinionLede: "معاصر سیاسی، سماجی، اقتصادی اور بین الاقوامی صورتِ حال پر شواہد سے آگاہ تبصرہ، خاص طور پر پاکستان اور جنوبی ایشیا کے تناظر میں۔",
    homeFeatured: "انتخابات، سیاسی رویے، جمہوری اداروں اور پاکستان و جنوبی ایشیا کی سیاسی پیش رفت پر منتخب اشاعتیں۔ ہر عنوان اس ویب سائٹ پر اپنا ریکارڈ کھولتا ہے، اور ناشر کا لنک ساتھ ہوتا ہے۔",
    homeReviews: "تحقیقی جائزے سیاسیات، انتخابی مطالعات اور متعلقہ سماجی علوم کے اہم علمی مطالعات کا جائزہ لیتے ہیں۔ ہر جائزہ مطالعے کے مرکزی استدلال، طریقۂ کار اور نتائج کی وضاحت کرتا ہے اور اس کی وسیع اہمیت پر غور کرتا ہے۔",
    homeOpinion: "رائے اور بلاگز معاصر سیاسی، سماجی، اقتصادی اور بین الاقوامی صورتِ حال پر شواہد سے آگاہ تبصرہ پیش کرتے ہیں، خاص طور پر پاکستان اور جنوبی ایشیا پر۔",
    liveNote: "جہاں یہ زبان پہلے سے لکھی نہیں، براہِ راست ترجمہ دکھایا جاتا ہے۔ شائع شدہ متن اپنی جگہ برقرار ہے۔",
    translating: "ترجمہ ہو رہا ہے…",
    translateFailed: "یہ زبان اس وقت ترجمہ نہیں ہو سکی۔ اصل متن دکھایا جا رہا ہے۔",
    searchLanguages: "زبان تلاش کریں",
    languageList: "زبانیں",
    noLanguage: "کوئی زبان نہیں ملی",
    suggested: "تجویز کردہ",
    allLanguages: "تمام زبانیں",
    minReadTemplate: "{n} منٹ کا مطالعہ",
    countOne: "{n} اشاعت",
    countMany: "{n} اشاعتیں",
    minRead: (count) => `${count} منٹ کا مطالعہ`,
    count: (count) => `${count} اشاعتیں`,
  },
};

export function normalizeLang(value) {
  return value === "ur" ? "ur" : "en";
}

export function readingCode(value) {
  const code = String(value || "").trim();
  return languageByCode(code) ? code : "en";
}

export function otherLang(lang) {
  return normalizeLang(lang) === "ur" ? "en" : "ur";
}

export function dirFor(lang) {
  return languageByCode(readingCode(lang))?.dir || "ltr";
}

export function ui(lang) {
  return copy[normalizeLang(lang)];
}

export function textLang(value) {
  return /[\u0600-\u06FF]/.test(String(value || "")) ? "ur" : "en";
}

export function navLabel(href, label, lang, pack) {
  const key = NAV_KEYS[href];
  const code = readingCode(lang);
  if (!key || code === "en") return label;
  if (code === "ur") return copy.ur[key];
  const translated = pack?.[key];
  if (!translated || translated === copy.en[key]) return label;
  return translated;
}

export function categoryLabel(category, lang) {
  if (normalizeLang(lang) !== "ur") return category || "";
  return CATEGORIES[category] || category || "";
}

const TYPE_NAMES = {
  ur: {
    "Journal Article": "تحقیقی مقالہ",
    "Book Chapter": "کتابی باب",
    "Research Report": "تحقیقی رپورٹ",
    "Conference Paper": "کانفرنس مقالہ",
    "Working Paper": "ورکنگ پیپر",
  },
};

export function typeHeading(type, lang) {
  const table = TYPE_HEADINGS[normalizeLang(lang)] || TYPE_HEADINGS.en;
  return table[type] || type || "";
}

export function typeName(type, lang) {
  if (normalizeLang(lang) !== "ur") return type || "";
  return TYPE_NAMES.ur[type] || typeHeading(type, lang);
}

export function typeLabel(type, lang) {
  const labels = ui(lang);
  if (type === "Publication") return labels.typePublication;
  if (type === "Research Review") return labels.typeReview;
  if (type === "Opinion") return labels.typeOpinion;
  return type || "";
}

function paragraphCount(alt) {
  const paragraphs = Array.isArray(alt?.paragraphs) ? alt.paragraphs.filter(Boolean) : [];
  const sections = Array.isArray(alt?.sections) ? alt.sections : [];
  return paragraphs.length + sections.reduce((sum, section) => sum + (section.paragraphs || []).filter(Boolean).length, 0);
}

export function editionReady(alt, { article = false } = {}) {
  if (!alt || typeof alt !== "object" || Array.isArray(alt)) return false;
  if (!READING_LANGS.includes(alt.lang)) return false;
  if (!String(alt.title || "").trim()) return false;
  if (alt.ready === true) return true;
  if (article) return paragraphCount(alt) > 0;
  return true;
}

export function selectEdition(item, preferred) {
  const record = item || {};
  const primary = normalizeLang(record.lang);
  const want = normalizeLang(preferred);
  const article = record.kind === "review" || record.kind === "opinion";
  const alt = editionReady(record.alt, { article }) ? record.alt : null;
  const useAlt = want !== primary && alt && alt.lang === want;
  if (!useAlt) {
    return {
      lang: primary,
      dir: dirFor(primary),
      title: record.title || "",
      subtitle: record.subtitle || "",
      summary: record.summary || "",
      excerpt: record.excerpt || "",
      citation: record.citation || "",
      paragraphs: record.paragraphs || [],
      sections: record.sections || [],
      fallback: want !== primary,
    };
  }
  const excerptSource = alt.paragraphs?.[0] || alt.sections?.[0]?.paragraphs?.[0] || alt.summary || "";
  return {
    lang: want,
    dir: dirFor(want),
    title: alt.title,
    subtitle: alt.subtitle || "",
    summary: alt.summary || "",
    excerpt: alt.excerpt || String(excerptSource).slice(0, 220).trim(),
    citation: alt.citation || "",
    paragraphs: alt.paragraphs || [],
    sections: alt.sections || [],
    fallback: false,
  };
}

export function readingMinutes(edition) {
  const chunks = [
    ...(edition?.paragraphs || []),
    ...(edition?.sections || []).flatMap((section) => [section.heading, ...(section.paragraphs || [])]),
  ];
  const words = chunks.join(" ").trim().split(/\s+/).filter(Boolean).length;
  if (!words) return 1;
  const rate = normalizeLang(edition?.lang) === "ur" ? 150 : 220;
  return Math.max(1, Math.round(words / rate));
}

export function languageMark(item, preferred) {
  const article = item?.kind === "review" || item?.kind === "opinion";
  const edition = selectEdition(item, preferred);
  const both = editionReady(item?.alt, { article });
  if (both) {
    return {
      text: normalizeLang(preferred) === "ur" ? "انگریزی · اردو" : "EN · UR",
      lang: normalizeLang(preferred),
      label: ui(preferred).bothLanguages,
    };
  }
  if (edition.lang === "ur") return { text: "اردو", lang: "ur", label: "اردو" };
  if (normalizeLang(preferred) === "ur") return { text: "EN", lang: "en", label: "English" };
  return null;
}
