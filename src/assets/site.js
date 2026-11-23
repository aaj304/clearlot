// Shared behaviour: the live "Cleared by" ticket, gentle scroll-in, and closing the mobile menu.
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
      t.querySelector("[data-booked]").textContent = window.clearlotTime(now);
      t.querySelector("[data-cleared]").textContent = window.clearlotTime(later);
    });
  }
  if (live.length) {
    tick();
    setInterval(tick, 30000);
  }

  // Gentle scroll-in. Blocks below the first screen rise softly into place as they come into view.
  // Skipped when the visitor asks for less motion, or the browser can't watch scrolling.
  var calm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!calm && "IntersectionObserver" in window) {
    var groups = [
      ".section-head", ".section .prose", ".example", ".rate", ".faq", ".link-rows", ".areas",
      ".call-panel", ".estimate-card", ".cta-row", ".done-grid > *",
    ];
    var staggered = [".steps > li", ".options > .option", ".promise-grid > div"];
    var targets = [];
    groups.forEach(function (sel) {
      document.querySelectorAll("main " + sel).forEach(function (el) { targets.push(el); });
    });
    staggered.forEach(function (sel) {
      document.querySelectorAll("main " + sel).forEach(function (el) {
        var i = Array.prototype.indexOf.call(el.parentNode.children, el);
        el.style.setProperty("--d", Math.min(i, 5) * 110 + "ms");
        targets.push(el);
      });
    });
    var fold = window.innerHeight * 0.9;
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    targets.forEach(function (el) {
      // Never hide what's already on screen, the hero, or anything in the booking form.
      if (el.closest(".hero, .page-head, .book, .on-review")) return;
      if (el.getBoundingClientRect().top < fold) return;
      el.classList.add("reveal");
      io.observe(el);
    });
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
