const MAX_BODY_BYTES = 12_000;

const worker = {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/api/contact") {
      return handleContactSubmission(request, env);
    }
    return env.ASSETS.fetch(request);
  }
};

export default worker;

async function handleContactSubmission(request, env) {
  try {
    if (!env.CONTROL_CENTRE_LEAD_ENDPOINT || !env.WEBSITE_INGESTION_SECRET) {
      return json({ ok: false, message: "We could not send your enquiry right now. Please call or WhatsApp instead." }, 503);
    }
    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, message: "Please shorten your message and try again." }, 413);
    }
    const form = await request.formData();
    const payload = {
      firstName: text(form, "firstName") || firstNameFromFullName(text(form, "name")),
      lastName: text(form, "lastName") || lastNameFromFullName(text(form, "name")),
      email: text(form, "email") || undefined,
      phone: text(form, "phone") || undefined,
      postcode: text(form, "postcode") || undefined,
      dogName: text(form, "dogName") || undefined,
      serviceInterest: text(form, "service") || undefined,
      preferredSchedule: text(form, "preferredSchedule") || text(form, "walk_goal") || undefined,
      preferredContactMethod: normaliseContactMethod(text(form, "preferredContactMethod")),
      enquiryText: text(form, "message"),
      consentConfirmed: form.get("consentConfirmed") === "on",
      sourcePage: request.headers.get("referer") || new URL("/contact.html", request.url).toString(),
      referrer: request.headers.get("cf-connecting-ip") ? "website_form" : undefined,
      websiteSubmissionId: crypto.randomUUID(),
      submittedTimestamp: new Date().toISOString()
    };
    const validationError = validatePayload(payload);
    if (validationError) return json({ ok: false, message: validationError }, 400);
    const body = JSON.stringify(payload);
    const timestamp = String(Date.now());
    const signature = await signBody(body, timestamp, env.WEBSITE_INGESTION_SECRET);
    const response = await fetch(env.CONTROL_CENTRE_LEAD_ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "idempotency-key": payload.websiteSubmissionId,
        "x-wagwalk-timestamp": timestamp,
        "x-wagwalk-signature": signature
      },
      body
    });
    if (!response.ok) {
      return json({ ok: false, message: "We could not send your enquiry right now. Please call or WhatsApp instead." }, 502);
    }
    return json({ ok: true, message: "Thanks, your enquiry has been sent. Wag & Walk Middleton will follow up directly." }, 202);
  } catch {
    return json({ ok: false, message: "We could not send your enquiry right now. Please call or WhatsApp instead." }, 500);
  }
}

function text(form, key) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function firstNameFromFullName(name) {
  return name.split(" ")[0] || "";
}

function lastNameFromFullName(name) {
  return name.split(" ").slice(1).join(" ") || undefined;
}

function normaliseContactMethod(value) {
  if (["email", "phone", "whatsapp"].includes(value)) return value;
  return "no_preference";
}

function validatePayload(payload) {
  if (!payload.firstName) return "Please enter your name.";
  if (!payload.email && !payload.phone) return "Please enter an email address or phone number.";
  if (!payload.enquiryText) return "Please enter a message.";
  if (!payload.consentConfirmed) return "Please confirm you are happy for Wag & Walk Middleton to contact you about this enquiry.";
  return null;
}

async function signBody(body, timestamp, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${body}`));
  const hex = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `sha256=${hex}`;
}

function json(payload, status) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
