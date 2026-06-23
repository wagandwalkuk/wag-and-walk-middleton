const registrationToggle = document.querySelector("[data-registration-toggle]");
const registrationOpenButtons = document.querySelectorAll("[data-registration-open]");
const registrationForm = document.querySelector("#client-registration-form");
const registrationCallout = document.querySelector(".registration-intro .callout");
const registrationFormHash = "#client-registration-form";

if (registrationForm) {
  const scrollToRegistrationCallout = (behavior = "smooth") => {
    if (registrationCallout) registrationCallout.scrollIntoView({ behavior, block: "start" });
  };

  const setRegistrationFormOpen = (shouldOpen, options = {}) => {
    const { shouldScroll = false, updateUrl = true, scrollBehavior = "smooth" } = options;

    if (registrationToggle) {
      registrationToggle.setAttribute("aria-expanded", String(shouldOpen));
      registrationToggle.textContent = shouldOpen ? "Hide Form" : "Complete Form";
    }

    registrationOpenButtons.forEach(button => {
      button.setAttribute("aria-expanded", String(shouldOpen));
    });
    registrationForm.hidden = !shouldOpen;

    if (updateUrl) {
      const nextUrl = shouldOpen
        ? `${window.location.pathname}${window.location.search}${registrationFormHash}`
        : `${window.location.pathname}${window.location.search}`;
      window.history.pushState(null, "", nextUrl);
    }

    if (shouldOpen) {
      registrationForm.classList.remove("is-opening");
      requestAnimationFrame(() => {
        registrationForm.classList.add("is-opening");
        if (shouldScroll) scrollToRegistrationCallout(scrollBehavior);
      });
    } else {
      registrationForm.classList.remove("is-opening");
    }
  };

  if (registrationToggle) {
    registrationToggle.addEventListener("click", () => {
      setRegistrationFormOpen(registrationToggle.getAttribute("aria-expanded") !== "true");
    });
  }

  registrationOpenButtons.forEach(button => {
    button.addEventListener("click", () => setRegistrationFormOpen(true, { shouldScroll: true }));
  });

  const applyRegistrationUrlState = () => {
    const shouldOpen = window.location.hash === registrationFormHash;
    setRegistrationFormOpen(shouldOpen, {
      shouldScroll: shouldOpen,
      updateUrl: false,
      scrollBehavior: "auto"
    });
  };

  window.addEventListener("popstate", applyRegistrationUrlState);
  applyRegistrationUrlState();

  if (window.location.hash === registrationFormHash) {
    window.addEventListener("load", () => {
      requestAnimationFrame(() => scrollToRegistrationCallout("auto"));
    }, { once: true });
  }
}
