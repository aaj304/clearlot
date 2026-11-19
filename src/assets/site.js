// Shared behaviour: the live "Cleared by" ticket, and closing the mobile menu.
(function () {
  var fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Regina",
    weekday: "short",
    hour: "numeric",
    minute: "2-digit",
  });
  window.clearlotTime = function (date) {
    return fmt.format(date).replace(",", "");
  };

  var live = document.querySelectorAll("[data-live-ticket]");
  function tick() {
    var now = new Date();
    var later = new Date(now.getTime() + 24 * 3600 * 1000);
    live.forEach(function (t) {
      t.querySelector("[data-booked]").textContent = "Now, " + window.clearlotTime(now);
      t.querySelector("[data-cleared]").textContent = window.clearlotTime(later);
    });
  }
  if (live.length) {
    tick();
    setInterval(tick, 30000);
  }

  var menu = document.querySelector(".nav-mobile");
  if (menu) {
    document.addEventListener("click", function (e) {
      if (menu.open && !menu.contains(e.target)) menu.open = false;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && menu.open) {
        menu.open = false;
        menu.querySelector("summary").focus();
      }
    });
  }
})();
