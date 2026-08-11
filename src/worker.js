const MAX_BODY_BYTES = 12_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 6;
const rateLimitStore = new Map();

const FIELD_LIMITS = {
  firstName: 80,
  lastName: 80,
  email: 160,
  phone: 40,
  addressLine1: 160,
  town: 100,
  postcode: 20,
  dogName: 80,
  dogDescription: 1000,
  dogBreed: 120,
  dogAge: 80,
  serviceInterest: 120,
  preferredSchedule: 240,
  meetAndGreetAvailability: 1200,
  reasonForEnquiry: 1000,
  enquiryText: 4000,
  sourcePage: 500,
  referrer: 500,
  websiteSubmissionId: 120
};

const CONTACT_METHODS = new Set(["email", "phone", "whatsapp", "no_preference"]);

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
    const hubEndpoint = getHubEndpoint(env);
    if (!hubEndpoint || !env.WEBSITE_INGESTION_SECRET) {
      return json({ ok: false, message: "Sorry, your request could not be sent right now. Please try again, or contact Wag & Walk directly." }, 503);
    }

    const rateLimitKey = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for") || "anonymous";
    if (isRateLimited(rateLimitKey)) {
      return json({ ok: false, message: "Please wait a moment before sending another request." }, 429);
    }

    const contentLength = Number(request.headers.get("content-length") || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return json({ ok: false, message: "Please shorten your message and try again." }, 413);
    }

    const form = await request.formData();
    if (text(form, "website")) {
      return json({ ok: true, message: "Thanks. Your meet-and-greet request has been sent to Wag & Walk. Nathan will review it and contact you to arrange the next step." }, 202);
    }

    const payload = cleanPayload({
      firstName: text(form, "firstName"),
      lastName: text(form, "lastName"),
      email: text(form, "email"),
      phone: text(form, "phone"),
      addressLine1: text(form, "addressLine1"),
      town: text(form, "town"),
      postcode: text(form, "postcode"),
      dogName: text(form, "dogName"),
      dogDescription: text(form, "dogDescription"),
      dogBreed: text(form, "dogBreed"),
      dogAge: text(form, "dogAge"),
      serviceInterest: text(form, "service") || text(form, "serviceInterest"),
      preferredSchedule: text(form, "preferredSchedule") || text(form, "walk_goal"),
      meetAndGreetAvailability: text(form, "meetAndGreetAvailability"),
      reasonForEnquiry: text(form, "reasonForEnquiry"),
      preferredContactMethod: normaliseContactMethod(text(form, "preferredContactMethod")),
      enquiryText: text(form, "message") || text(form, "enquiryText"),
      consentConfirmed: form.get("consentConfirmed") === "on" || form.get("consentConfirmed") === "true",
      sourcePage: safeSourcePage(request),
      referrer: safeReferrer(request),
      websiteSubmissionId: text(form, "websiteSubmissionId") || crypto.randomUUID(),
      submittedTimestamp: new Date().toISOString()
    });

    const validationError = validatePayload(payload);
    if (validationError) return json({ ok: false, message: validationError }, 400);

    const body = JSON.stringify(payload);
    if (new TextEncoder().encode(body).length > MAX_BODY_BYTES) {
      return json({ ok: false, message: "Please shorten your message and try again." }, 413);
    }

    const timestamp = String(Date.now());
    const signature = await signBody(body, timestamp, env.WEBSITE_INGESTION_SECRET);
    const response = await fetch(hubEndpoint, {
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
      return json({ ok: false, message: "Sorry, your request could not be sent right now. Please try again, or contact Wag & Walk directly." }, 502);
    }

    return json({ ok: true, message: "Thanks. Your meet-and-greet request has been sent to Wag & Walk. Nathan will review it and contact you to arrange the next step." }, 202);
  } catch {
    return json({ ok: false, message: "Sorry, your request could not be sent right now. Please try again, or contact Wag & Walk directly." }, 500);
  }
}

function getHubEndpoint(env) {
  if (env.HUB_BASE_URL) {
    return `${String(env.HUB_BASE_URL).replace(/\/+$/, "")}/api/integrations/website/leads`;
  }
  return "";
}

function text(form, key) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ") : "";
}

function normaliseContactMethod(value) {
  return CONTACT_METHODS.has(value) ? value : "no_preference";
}

function safeSourcePage(request) {
  const referer = request.headers.get("referer");
  if (!referer) return new URL("/contact.html", request.url).toString();
  try {
    const url = new URL(referer);
    return url.toString().slice(0, FIELD_LIMITS.sourcePage);
  } catch {
    return new URL("/contact.html", request.url).toString();
  }
}

function safeReferrer(request) {
  const referrer = request.headers.get("referer");
  if (!referrer) return "website_form";
  try {
    return new URL(referrer).hostname.slice(0, FIELD_LIMITS.referrer);
  } catch {
    return "website_form";
  }
}

function cleanPayload(payload) {
  const cleaned = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null || value === "") continue;
    cleaned[key] = typeof value === "string" && FIELD_LIMITS[key] ? value.slice(0, FIELD_LIMITS[key]) : value;
  }
  return cleaned;
}

function validatePayload(payload) {
  if (!payload.firstName) return "Please enter your first name.";
  if (!payload.lastName) return "Please enter your surname.";
  if (!payload.email && !payload.phone) return "Please enter an email address or phone number.";
  if (!payload.enquiryText) return "Please enter a message.";
  if (!payload.consentConfirmed) return "Please confirm you are happy for Wag & Walk Middleton to contact you about this enquiry.";
  if (!payload.websiteSubmissionId) return "Please refresh the page and try again.";
  if (!payload.submittedTimestamp || Number.isNaN(Date.parse(payload.submittedTimestamp))) return "Please refresh the page and try again.";
  if (payload.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) return "Please enter a valid email address.";
  if (payload.phone && (!/^[0-9+() -]{10,40}$/.test(payload.phone) || (payload.phone.match(/\d/g) || []).length < 10)) return "Please enter a valid phone number.";
  if (!payload.postcode || !/^(GIR ?0AA|(?:[A-PR-UWYZ][0-9][0-9A-HJKSTUW]?|[A-PR-UWYZ][A-HK-Y][0-9][0-9ABEHMNPRVWXY]?) ?[0-9][ABD-HJLNP-UW-Z]{2})$/i.test(payload.postcode)) return "Please enter a valid UK postcode.";
  if (payload.sourcePage) {
    try {
      new URL(payload.sourcePage);
    } catch {
      return "Please refresh the page and try again.";
    }
  }
  if (payload.preferredContactMethod && !CONTACT_METHODS.has(payload.preferredContactMethod)) {
    return "Please choose a valid contact preference.";
  }
  for (const [key, limit] of Object.entries(FIELD_LIMITS)) {
    if (typeof payload[key] === "string" && payload[key].length > limit) {
      return "Please shorten your message and try again.";
    }
  }
  return null;
}

function isRateLimited(key) {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now - entry.startedAt > RATE_LIMIT_WINDOW_MS) {
    rateLimitStore.set(key, { startedAt: now, count: 1 });
    cleanupRateLimitStore(now);
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function cleanupRateLimitStore(now) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.startedAt > RATE_LIMIT_WINDOW_MS * 3) rateLimitStore.delete(key);
  }
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
