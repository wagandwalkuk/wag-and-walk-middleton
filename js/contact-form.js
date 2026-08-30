const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const requestedMessage = new URLSearchParams(window.location.search).get("message");
  const messageField = contactForm.querySelector('[name="message"]');
  const submissionIdField = contactForm.querySelector("[data-submission-id]");
  const status = document.querySelector("[data-contact-status]");

  if (requestedMessage && messageField) {
    messageField.value = requestedMessage;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const emailField = contactForm.querySelector('[name="email"]');
    const phoneField = contactForm.querySelector('[name="phone"]');
    const consentField = contactForm.querySelector('[name="consentConfirmed"]');

    if (!contactForm.reportValidity()) return;
    if (!fieldValue(emailField) && !fieldValue(phoneField)) {
      setStatus(status, "Please enter an email address or phone number.", "error");
      if (phoneField) phoneField.focus();
      return;
    }
    if (consentField && !consentField.checked) {
      setStatus(status, "Please confirm you are happy for Wag & Walk Middleton to contact you about this enquiry.", "error");
      consentField.focus();
      return;
    }

    if (submissionIdField && !submissionIdField.value) {
      submissionIdField.value = createSubmissionId();
    }

    setStatus(status, "Sending your meet-and-greet request...", "info");
    const submitButton = contactForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.disabled = true;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        body: new FormData(contactForm)
      });
      const result = await response.json();
      if (!response.ok || !result.ok) {
        setStatus(status, result.message || "Please check the form and try again.", "error");
        return;
      }
      const selectedService = serviceType(contactForm.querySelector('[name="service"]'));
      contactForm.reset();
      if (submissionIdField) submissionIdField.value = "";
      if (window.WagWalkAnalytics) {
        window.WagWalkAnalytics.trackEvent("generate_lead", {
          enquiry_type: "meet_and_greet",
          service_type: selectedService,
          form_location: window.location.pathname
        });
      }
      setStatus(status, result.message, "success");
    } catch {
      setStatus(status, "Sorry, your request could not be sent right now. Please try again, or contact Wag & Walk directly.", "error");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
}

function setStatus(element, message, type) {
  if (!element) return;
  element.textContent = message;
  element.hidden = false;
  element.dataset.status = type;
}

function createSubmissionId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `website-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function fieldValue(field) {
  return field && typeof field.value === "string" ? field.value.trim() : "";
}

function serviceType(field) {
  const service = field && typeof field.value === "string" ? field.value : "";
  const values = {
    "30 Minute Solo Walk": "solo_walk_30",
    "60 Minute Solo Walk": "solo_walk_60",
    "House Visit": "house_visit",
    "Flex Credits": "flex_credits",
    "I'm not sure yet": "not_sure"
  };
  return values[service] || "not_specified";
}
