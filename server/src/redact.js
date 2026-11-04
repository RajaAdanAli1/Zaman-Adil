export function publicError(error) {
  const raw = typeof error === "string" ? error : error?.message;
  return String(raw || "The server could not start.")
    .replace(/mongodb(?:\+srv)?:\/\/\S+/gi, "mongodb://[redacted]")
    .replace(/\/\/([^/\s:@]+):([^@\s/]+)@/g, "//[redacted]@")
    .slice(0, 400);
}
