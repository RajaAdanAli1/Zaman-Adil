export const LANGUAGES = [
  { code: "en", name: "English", native: "English", dir: "ltr" },
  { code: "ur", name: "Urdu", native: "اردو", dir: "rtl" },
  { code: "ar", name: "Arabic", native: "العربية", dir: "rtl" },
  { code: "fa", name: "Persian", native: "فارسی", dir: "rtl" },
  { code: "ps", name: "Pashto", native: "پښتو", dir: "rtl" },
  { code: "sd", name: "Sindhi", native: "سنڌي", dir: "rtl" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", dir: "ltr" },
  { code: "hi", name: "Hindi", native: "हिन्दी", dir: "ltr" },
  { code: "bn", name: "Bengali", native: "বাংলা", dir: "ltr" },
  { code: "ta", name: "Tamil", native: "தமிழ்", dir: "ltr" },
  { code: "te", name: "Telugu", native: "తెలుగు", dir: "ltr" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", dir: "ltr" },
  { code: "mr", name: "Marathi", native: "मराठी", dir: "ltr" },
  { code: "ne", name: "Nepali", native: "नेपाली", dir: "ltr" },
  { code: "si", name: "Sinhala", native: "සිංහල", dir: "ltr" },
  { code: "zh-CN", name: "Chinese (Simplified)", native: "中文", dir: "ltr" },
  { code: "zh-TW", name: "Chinese (Traditional)", native: "繁體中文", dir: "ltr" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr" },
  { code: "ko", name: "Korean", native: "한국어", dir: "ltr" },
  { code: "fr", name: "French", native: "Français", dir: "ltr" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr" },
  { code: "es", name: "Spanish", native: "Español", dir: "ltr" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "ltr" },
  { code: "it", name: "Italian", native: "Italiano", dir: "ltr" },
  { code: "ru", name: "Russian", native: "Русский", dir: "ltr" },
  { code: "uk", name: "Ukrainian", native: "Українська", dir: "ltr" },
  { code: "tr", name: "Turkish", native: "Türkçe", dir: "ltr" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia", dir: "ltr" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu", dir: "ltr" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr" },
  { code: "pl", name: "Polish", native: "Polski", dir: "ltr" },
  { code: "sv", name: "Swedish", native: "Svenska", dir: "ltr" },
  { code: "el", name: "Greek", native: "Ελληνικά", dir: "ltr" },
  { code: "he", name: "Hebrew", native: "עברית", dir: "rtl" },
  { code: "th", name: "Thai", native: "ไทย", dir: "ltr" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt", dir: "ltr" },
  { code: "ro", name: "Romanian", native: "Română", dir: "ltr" },
  { code: "cs", name: "Czech", native: "Čeština", dir: "ltr" },
  { code: "hu", name: "Hungarian", native: "Magyar", dir: "ltr" },
  { code: "fi", name: "Finnish", native: "Suomi", dir: "ltr" },
  { code: "da", name: "Danish", native: "Dansk", dir: "ltr" },
  { code: "no", name: "Norwegian", native: "Norsk", dir: "ltr" },
  { code: "sw", name: "Swahili", native: "Kiswahili", dir: "ltr" },
];

export const SUGGESTED = ["en", "ur", "ar", "hi", "pa", "sd", "ps", "fa", "fr"];

const byCode = new Map(LANGUAGES.map((language) => [language.code, language]));

export function languageByCode(value) {
  return byCode.get(String(value || "").trim()) || null;
}
