(function () {
  var q = new URLSearchParams(location.search);
  var ref = (q.get("ref") || "").replace(/[^A-Z0-9-]/gi, "").slice(0, 16);
  var plan = q.get("plan") === "winter" ? "winter" : "once";
  var t = Number(q.get("t")) * 1000;
  if (q.get("mail") === "1") document.querySelector("[data-mail-line]").hidden = false;
  var when = t > 0 && Math.abs(Date.now() - t) < 7 * 864e5 ? new Date(t) : new Date();

  var ticket = document.querySelector(".wo");
  if (ref) {
    document.querySelector("[data-ref-line] [data-ref]").textContent = ref;
    document.querySelector("[data-ref-line]").hidden = false;
    ticket.querySelector("[data-ref]").textContent = "No. " + ref;
  } else {
    ticket.querySelector("[data-ref]").textContent = "";
  }
  ticket.querySelector("[data-booked]").textContent = window.clearlotTime(when);
  if (plan === "winter") {
    ticket.querySelector("[data-cleared]").textContent = "24 h after each snowfall";
    document.querySelector("h1").textContent = "Thank you. We have your request.";
    document.querySelector(".eyebrow").textContent = "Request received";
    document.querySelector(".lede").textContent =
      "We’ll call you to set up a visit and give you a price for the whole winter. Nothing has been charged.";
    document.querySelector("[data-call-text]").textContent =
      "To set up a time to see your home. Then we give you a price for the whole winter.";
    document.querySelector("[data-plan-text]").textContent =
      "Once you say yes, after every snowfall, within 24 hours after the snow stops.";
    document.querySelector("[data-pay-text]").textContent =
      "All at once, or month by month from November to March.";
  } else {
    ticket.querySelector("[data-cleared]").textContent = window.clearlotTime(new Date(when.getTime() + 864e5));
  }

  if (window.__conversion && window.gtag && ref) {
    gtag("event", "conversion", { send_to: window.__conversion, transaction_id: ref });
  }
})();
