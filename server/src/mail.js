const DEFAULT_INBOX = "zamanuog@gmail.com";

const captured = [];

function singleLine(value) {
  return String(value || "").replace(/[\r\n\u0000]+/g, " ").trim();
}

export function contactRecipient() {
  const configured = singleLine(process.env.MAIL_TO || DEFAULT_INBOX);
  return configured || DEFAULT_INBOX;
}

function mailOrigin() {
  const configured = singleLine(process.env.SITE_URL || "");
  if (/^https:\/\//i.test(configured) && !/localhost|127\.0\.0\.1/i.test(configured)) {
    return configured.replace(/\/$/, "");
  }
  return "https://zamanadil.com";
}

export function buildContactMail(enquiry) {
  const lines = [
    `Name: ${enquiry.name}`,
    `Email: ${enquiry.email}`,
    enquiry.organisation ? `Institution: ${enquiry.organisation}` : "",
    enquiry.country ? `Country: ${enquiry.country}` : "",
    `Nature of enquiry: ${enquiry.enquiry}`,
    "",
    enquiry.message,
  ].filter((line) => line !== "");

  return {
    to: contactRecipient(),
    replyTo: singleLine(enquiry.email),
    subject: singleLine(`[zamanadil.com] ${enquiry.subject}`).slice(0, 200),
    text: lines.join("\n"),
  };
}

export function takeCapturedMail() {
  return captured.splice(0, captured.length);
}

export function resetMailState() {
  captured.length = 0;
}

export async function sendContactEmail(enquiry) {
  const message = buildContactMail(enquiry);
  if (process.env.NODE_ENV === "test") {
    captured.push(message);
    return { sent: false, captured: true };
  }

  const origin = mailOrigin();
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(message.to)}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: origin,
      Referer: `${origin}/contact`,
    },
    body: JSON.stringify({
      _subject: message.subject,
      _template: "table",
      _captcha: "false",
      _replyto: message.replyTo,
      name: enquiry.name,
      email: enquiry.email,
      institution: enquiry.organisation || "",
      country: enquiry.country || "",
      enquiry: enquiry.enquiry,
      message: enquiry.message,
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || String(payload.success) !== "true") {
    const detail = singleLine(payload.message) || "The mail service did not accept the enquiry.";
    if (/activation/i.test(detail)) {
      throw new Error(`Open the activation email sent to ${message.to}, then new contact messages will be delivered there.`);
    }
    throw new Error(detail);
  }
  return { sent: true };
}
