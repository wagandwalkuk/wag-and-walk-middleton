(() => {
  "use strict";

  const selector = "[data-preferred-source]";
  const sourceScript = "https://news.google.com/swg/js/v1/publisher.js";

  function createPlacement() {
    const path = window.location.pathname.replace(/\.html$/, "").replace(/\/$/, "") || "/";
    const isBlog = path === "/blog";
    const isBehindTheLead = path === "/behind-the-lead";
    const isArticle = path.startsWith("/blog/") || path.startsWith("/behind-the-lead/");
    if (!isBlog && !isBehindTheLead && !isArticle) return null;

    const anchor = document.querySelector(".contact-strip");
    if (!anchor || document.querySelector(selector)) return null;

    const placement = document.createElement("section");
    placement.className = "preferred-source container";
    placement.dataset.preferredSource = "";
    placement.dataset.pageType = isBehindTheLead || path.startsWith("/behind-the-lead/") ? "behind_the_lead" : "dog_care_advice";
    placement.dataset.placement = isArticle ? "article_end" : "editorial_index";
    placement.setAttribute("aria-labelledby", "preferred-source-title");
    placement.innerHTML = [
      '<h2 id="preferred-source-title">Prefer Wag &amp; Walk in Google Search</h2>',
      '<p>Add Wag &amp; Walk as a preferred source for more dog-care advice and Behind The Lead content in Google.</p>',
      '<div google-add-preferred-source-btn data-theme="light" data-lang="en"></div>'
    ].join("");

    anchor.parentNode.insertBefore(placement, anchor);
    return placement;
  }

  function initialisePreferredSources() {
    const createdPlacement = createPlacement();
    const placements = Array.from(document.querySelectorAll(selector));
    if (!placements.length) return;

    placements.forEach(placement => {
      placement.addEventListener("click", () => {
        if (!window.WagWalkAnalytics) return;
        window.WagWalkAnalytics.trackEvent("preferred_source_interaction", {
          page_path: window.location.pathname,
          page_type: placement.dataset.pageType || "editorial",
          placement: placement.dataset.placement || "article_end"
        });
      }, { once: true, capture: true });
    });

    if (document.querySelector("script[data-google-preferred-sources]")) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = sourceScript;
    script.dataset.googlePreferredSources = "true";
    script.onerror = () => {
      placements.forEach(placement => placement.classList.add("preferred-source--unavailable"));
    };
    document.head.append(script);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initialisePreferredSources, { once: true });
  } else {
    initialisePreferredSources();
  }
})();
