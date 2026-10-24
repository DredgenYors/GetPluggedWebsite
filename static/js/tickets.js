(function () {
  const form = document.getElementById("gp-ticket-form");
  if (!form) return;

  const csrfEl = document.getElementById("gp-ticket-csrf");
  const eventIdEl = document.getElementById("gp-ticket-event-id");
  const csrfToken = csrfEl ? csrfEl.value : null;
  const eventId = eventIdEl ? eventIdEl.value : null;
  if (!csrfToken || !eventId) return;

  const errorEl = document.getElementById("gp-ticket-form-error");
  const submitBtn = document.getElementById("gp-ticket-submit-btn");
  const paymentStage = document.getElementById("gp-ticket-payment-stage");
  const thanksStage = document.getElementById("gp-ticket-thanks-stage");
  const payBtn = document.getElementById("gp-ticket-pay-btn");

  function showStage(stage) {
    [form, paymentStage, thanksStage].forEach((el) => {
      if (el) el.hidden = el !== stage;
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (errorEl) errorEl.hidden = true;
    submitBtn.disabled = true;

    const body = {
      name: document.getElementById("gp-ticket-name").value,
      email: document.getElementById("gp-ticket-email").value,
      phone: document.getElementById("gp-ticket-phone").value,
      quantity: document.getElementById("gp-ticket-quantity").value,
    };

    let result;
    try {
      const res = await fetch(`/events/${eventId}/ticket-orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-CSRFToken": csrfToken },
        body: JSON.stringify(body),
      });
      result = await res.json();
    } catch (err) {
      result = { ok: false, error: "Network error. Please try again." };
    }

    if (result.ok) {
      if (payBtn) payBtn.href = result.square_checkout_url;
      showStage(paymentStage);
    } else if (errorEl) {
      errorEl.textContent = result.error || "Something went wrong. Please try again.";
      errorEl.hidden = false;
    }
    submitBtn.disabled = false;
  });

  // Clicking through to Square is the signal this page's job is done -
  // there's no way to know from here whether the customer actually
  // completes payment on Square's own page (see TicketOrder's own note on
  // why), so this just moves to the final "thank you" state the moment
  // they head over there. The link's own target="_blank" still opens the
  // new tab normally alongside this.
  if (payBtn) {
    payBtn.addEventListener("click", () => {
      showStage(thanksStage);
    });
  }
})();
