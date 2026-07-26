const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const requestedMessage = new URLSearchParams(window.location.search).get("message");
  const messageField = contactForm.querySelector('[name="message"]');
  const status = document.querySelector("[data-contact-status]");

  if (requestedMessage && messageField) {
    messageField.value = requestedMessage;
  }

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus(status, "Sending your enquiry...", "info");
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
      contactForm.reset();
      setStatus(status, result.message, "success");
    } catch {
      setStatus(status, "We could not send your enquiry right now. Please call or WhatsApp instead.", "error");
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
