(function () {
  var q = new URLSearchParams(location.search);
  var ref = (q.get("ref") || "").replace(/[^A-Z0-9-]/gi, "").slice(0, 16);
  var plan = q.get("plan") === "winter" ? "winter" : "once";
  var t = Number(q.get("t")) * 1000;
  var when = t > 0 && Math.abs(Date.now() - t) < 7 * 864e5 ? new Date(t) : new Date();

  if (ref) {
    document.querySelector("[data-ref]").textContent = ref;
    document.querySelector("[data-ref-line]").hidden = false;
  }
  var ticket = document.querySelector(".ticket");
  ticket.querySelector("[data-booked]").textContent = window.clearlotTime(when);
  if (plan === "winter") {
    ticket.querySelector("[data-cleared]").textContent = "24 h after each snowfall";
    document.querySelector("[data-plan-text]").textContent =
      "After every snowfall on your whole winter plan, within 24 hours after the snow stops.";
  } else {
    ticket.querySelector("[data-cleared]").textContent = window.clearlotTime(new Date(when.getTime() + 864e5));
  }

  if (window.__conversion && window.gtag && ref) {
    gtag("event", "conversion", { send_to: window.__conversion, transaction_id: ref });
  }
})();
