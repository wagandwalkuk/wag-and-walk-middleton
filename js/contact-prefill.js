const contactForm = document.querySelector("[data-contact-form]");

if (contactForm) {
  const requestedMessage = new URLSearchParams(window.location.search).get("message");
  const messageField = contactForm.querySelector('[name="message"]');

  if (requestedMessage && messageField) {
    messageField.value = requestedMessage;
  }
}
