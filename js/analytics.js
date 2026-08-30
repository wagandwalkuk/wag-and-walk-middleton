(() => {
  "use strict";

  const CONSENT_KEY = "wagwalk_cookie_consent";
  const CONFIG_URL = "/api/analytics-config";
  const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
  const consentStates = {
    granted: {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    },
    denied: {
      analytics_storage: "denied",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied"
    }
  };

  let consent = readConsent();
  let measurementId = "";
  let initialising = false;
  let pageViewSent = false;
  const pendingEvents = [];

  window.WagWalkAnalytics = {
    trackEvent,
    openConsentSettings
  };

  createConsentInterface();
  addFooterControls();
  addContactClickTracking();

  if (consent && consent.analytics) initialiseAnalytics();
  window.addEventListener("popstate", () => sendPageView(true));

  function createConsentInterface() {
    const banner = document.createElement("section");
    banner.className = "cookie-consent";
    banner.id = "cookie-consent";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-modal", "false");
    banner.setAttribute("aria-labelledby", "cookie-consent-title");
    banner.hidden = Boolean(consent);
    banner.innerHTML = [
      '<div class="cookie-consent__content">',
      '<p class="eyebrow">Your Privacy</p>',
      '<h2 id="cookie-consent-title">Optional analytics cookies</h2>',
      '<p>We would like to use optional analytics cookies to understand how people use this website and improve Wag &amp; Walk Middleton. They are off unless you accept.</p>',
      '<p><a href="/policies.html#privacy-cookies">Read our privacy and cookies information</a>.</p>',
      '<div class="cookie-consent__actions">',
      '<button class="button primary" type="button" data-consent-accept>Accept analytics</button>',
      '<button class="button secondary" type="button" data-consent-reject>Reject optional cookies</button>',
      '</div>',
      '</div>'
    ].join("");
    document.body.append(banner);

    banner.querySelector("[data-consent-accept]").addEventListener("click", () => setConsent(true));
    banner.querySelector("[data-consent-reject]").addEventListener("click", () => setConsent(false));
  }

  function addFooterControls() {
    const footer = document.querySelector(".footer-bottom");
    if (!footer || footer.querySelector("[data-cookie-settings]")) return;

    const controls = document.createElement("p");
    controls.className = "footer-privacy-controls";
    controls.innerHTML = '<a href="/policies.html#privacy-cookies">Privacy &amp; cookies</a> <span aria-hidden="true">|</span> <button type="button" data-cookie-settings>Cookie Settings</button>';
    footer.append(controls);
    controls.querySelector("[data-cookie-settings]").addEventListener("click", openConsentSettings);
  }

  function openConsentSettings() {
    const banner = document.querySelector("#cookie-consent");
    if (!banner) return;
    banner.hidden = false;
    banner.querySelector("[data-consent-accept]").focus();
  }

  function setConsent(analyticsAllowed) {
    consent = { analytics: analyticsAllowed, updatedAt: new Date().toISOString() };
    writeConsent(consent);
    const banner = document.querySelector("#cookie-consent");
    if (banner) banner.hidden = true;

    if (analyticsAllowed) {
      initialiseAnalytics();
      return;
    }

    updateGoogleConsent(consentStates.denied);
    clearGoogleAnalyticsCookies();
    pendingEvents.length = 0;
  }

  async function initialiseAnalytics() {
    if (initialising || measurementId || isLocalDevelopment()) return;
    initialising = true;

    try {
      const response = await fetch(CONFIG_URL, {
        headers: { accept: "application/json" },
        credentials: "same-origin"
      });
      if (!response.ok) return;

      const config = await response.json();
      if (!config || !config.enabled || !/^G-[A-Z0-9]+$/i.test(config.measurementId || "")) return;

      measurementId = config.measurementId;
      setupGoogleTag(measurementId);
      sendPageView();
      while (pendingEvents.length) emitEvent(...pendingEvents.shift());
    } catch {
      // Analytics must never affect the public site if the config route or Google is unavailable.
    } finally {
      initialising = false;
    }
  }

  function setupGoogleTag(id) {
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function gtag() { window.dataLayer.push(arguments); };
    window.gtag("consent", "default", consentStates.denied);
    window.gtag("consent", "update", consentStates.granted);
    window.gtag("js", new Date());
    window.gtag("config", id, { send_page_view: false });

    if (!document.querySelector("script[data-wagwalk-ga4]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
      script.dataset.wagwalkGa4 = "true";
      document.head.append(script);
    }
  }

  function updateGoogleConsent(nextConsent) {
    if (typeof window.gtag === "function") window.gtag("consent", "update", nextConsent);
  }

  function sendPageView(force = false) {
    if (!measurementId || !consent || !consent.analytics) return;
    if (pageViewSent && !force) return;

    emitEvent("page_view", {
      page_location: safePageLocation(),
      page_path: window.location.pathname,
      page_title: document.title
    });
    pageViewSent = true;
  }

  function trackEvent(eventName, parameters = {}) {
    if (!consent || !consent.analytics || isLocalDevelopment()) return;
    if (!measurementId) {
      pendingEvents.push([eventName, parameters]);
      initialiseAnalytics();
      return;
    }
    emitEvent(eventName, parameters);
  }

  function emitEvent(eventName, parameters) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", eventName, cleanParameters(parameters));
  }

  function addContactClickTracking() {
    document.addEventListener("click", event => {
      const link = event.target.closest("a[href]");
      if (!link || event.defaultPrevented) return;

      const href = link.getAttribute("href") || "";
      const label = normaliseLabel(link.textContent || link.getAttribute("aria-label") || "");
      const location = window.location.pathname;

      if (href.startsWith("tel:")) {
        trackEvent("contact_phone", { link_location: location, cta_label: label });
      } else if (href.startsWith("mailto:")) {
        trackEvent("contact_email", { link_location: location, cta_label: label });
      } else if (/^(https?:)?\/\/(wa\.me|(?:www\.)?whatsapp\.com)\//i.test(href)) {
        trackEvent("contact_whatsapp", { link_location: location, cta_label: label });
      } else if (isBookingCta(link, label)) {
        trackEvent("begin_booking", { link_location: location, cta_label: label, booking_type: "meet_and_greet" });
      }
    });
  }

  function isBookingCta(link, label) {
    const href = link.getAttribute("href") || "";
    const contactPath = /^\/?contact(?:\.html)?(?:[?#]|$)/i.test(href);
    return contactPath && /book|enquir|availability|meet.and.greet|get.started/i.test(label);
  }

  function cleanParameters(parameters) {
    const cleaned = {};
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value !== "string") continue;
      const safeValue = key === "page_location" ? safePageLocation() : value.replace(/[^a-z0-9_\-/. ]/gi, "").trim().slice(0, 100);
      if (safeValue) cleaned[key] = safeValue;
    }
    if (isDebugMode()) cleaned.debug_mode = true;
    return cleaned;
  }

  function normaliseLabel(value) {
    return value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 80) || "contact_link";
  }

  function safePageLocation() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function readConsent() {
    try {
      const stored = window.localStorage.getItem(CONSENT_KEY);
      const parsed = stored ? JSON.parse(stored) : null;
      return parsed && typeof parsed.analytics === "boolean" ? parsed : null;
    } catch {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify(value));
    } catch {
      // A visitor can still make a consent choice for this visit if storage is unavailable.
    }
  }

  function clearGoogleAnalyticsCookies() {
    document.cookie.split(";").forEach(cookie => {
      const name = cookie.split("=")[0].trim();
      if (!/^_(?:ga|gid|gat)/.test(name)) return;
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
      document.cookie = `${name}=; Max-Age=0; path=/; domain=${window.location.hostname}; SameSite=Lax`;
    });
  }

  function isLocalDevelopment() {
    return LOCAL_HOSTS.has(window.location.hostname) && !isDebugMode();
  }

  function isDebugMode() {
    return new URLSearchParams(window.location.search).get("analytics_debug") === "1";
  }
})();
