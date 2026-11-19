// Step-by-step booking. Without JavaScript the form still works as one long page.
(function () {
  var form = document.getElementById("book-form");
  if (!form) return;
  var prices = JSON.parse(document.getElementById("prices").textContent);
  var steps = Array.prototype.slice.call(form.querySelectorAll(".step"));
  var bars = form.querySelectorAll(".progress span");
  var countEl = form.querySelector("[data-step-count]");
  var back = form.querySelector("[data-back]");
  var next = form.querySelector("[data-next]");
  var lot = form.querySelector(".lot");
  var ticket = form.querySelector(".ticket");
  var current = 0;
  var backToReview = false; // after "Change" on the review screen, Next returns there

  var LABELS = {};
  form.querySelectorAll(".option").forEach(function (o) {
    var input = o.querySelector("input");
    LABELS[input.name + ":" + input.value] = o.querySelector(".option-title").textContent;
  });

  form.started.value = String(Date.now());

  // Links like /book/?driveway=double pre-select a choice.
  var q = new URLSearchParams(location.search);
  ["plan", "driveway", "sidewalk", "walkway"].forEach(function (k) {
    var v = q.get(k);
    var el = v && form.querySelector('input[name="' + k + '"][value="' + CSS.escape(v) + '"]');
    if (el) el.checked = true;
  });

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function state() {
    return {
      plan: val("plan"),
      driveway: val("driveway"),
      sidewalk: val("sidewalk"),
      walkway: val("walkway"),
      steps: form.steps.checked,
      iceMelt: form.iceMelt.checked,
    };
  }
  function price(s) {
    var p = prices[s.plan || "once"];
    var t = (p.driveway[s.driveway] || 0) + (p.sidewalk[s.sidewalk] || 0) + (p.walkway[s.walkway] || 0);
    if (s.steps) t += p.steps;
    if (s.iceMelt) t += p.iceMelt;
    return t;
  }
  function isOn(s, k, v) {
    var cur = s[k];
    if (v === "?") return cur === "" || cur === undefined;
    if (v.charAt(0) === "!") return String(cur) !== v.slice(1);
    return String(cur) === v;
  }
  var money = function (n) { return "$" + n.toLocaleString("en-CA"); };

  function update() {
    var s = state();
    form.dataset.plan = s.plan;
    lot.querySelectorAll("[data-k]").forEach(function (g) {
      g.classList.toggle("on", isOn(s, g.dataset.k, g.dataset.v));
    });
    lot.setAttribute("data-ice", s.iceMelt ? "1" : "0");

    var total = price(s);
    form.querySelector("[data-total]").textContent = s.driveway ? money(total) : "$0";
    form.querySelector("[data-total-unit]").textContent =
      s.plan === "winter" ? "For the winter, plus GST" : "Per visit, plus GST";

    var rows = [
      ["How often", s.plan ? LABELS["plan:" + s.plan] : ""],
      ["Driveway", s.driveway ? LABELS["driveway:" + s.driveway] : ""],
      ["Sidewalk", s.sidewalk ? LABELS["sidewalk:" + s.sidewalk] : ""],
      ["Walkway", s.walkway ? LABELS["walkway:" + s.walkway] : ""],
    ];
    var extras = [];
    if (s.steps) extras.push("Front steps");
    if (s.iceMelt) extras.push("Ice melt");
    if (extras.length) rows.push(["Extras", extras.join(", ")]);
    form.querySelector("[data-summary]").innerHTML = rows
      .map(function (r) {
        return "<div><dt>" + r[0] + "</dt><dd>" + (r[1] || '<span class="muted">Not chosen yet</span>') + "</dd></div>";
      })
      .join("");

    var now = new Date();
    if (s.plan === "winter") {
      ticket.querySelector("[data-booked]").textContent = "Today";
      ticket.querySelector("[data-cleared]").textContent = "24 h after each snowfall";
    } else {
      ticket.querySelector("[data-booked]").textContent = "Now, " + window.clearlotTime(now);
      ticket.querySelector("[data-cleared]").textContent = window.clearlotTime(new Date(now.getTime() + 864e5));
    }

    var other = form.querySelector("[data-other-fields]");
    other.hidden = !form.forOther.checked;
  }

  function esc(t) {
    var d = document.createElement("div");
    d.textContent = t;
    return d.innerHTML;
  }
  function review() {
    var s = state();
    var index = function (k) { return steps.findIndex(function (st) { return st.dataset.step === k; }); };
    var extras = [];
    if (s.steps) extras.push("Front steps");
    if (s.iceMelt) extras.push("Ice melt");
    var who = form.name.value.trim() + ", " + form.phone.value.trim();
    if (form.forOther.checked && form.otherName.value.trim()) who += " (for " + form.otherName.value.trim() + ")";
    var rows = [
      ["Address", form.address.value.trim() + ", Regina", "address"],
      ["How often", LABELS["plan:" + s.plan], "plan"],
      ["Driveway", LABELS["driveway:" + s.driveway], "driveway"],
      ["Sidewalk", LABELS["sidewalk:" + s.sidewalk], "sidewalk"],
      ["Walkway", LABELS["walkway:" + s.walkway], "walkway"],
      ["Extras", extras.length ? extras.join(", ") : "None", "extras"],
      ["Contact", who, "contact"],
      ["Price", money(price(s)) + (s.plan === "winter" ? " for the winter" : " per visit") + ", plus GST", null],
    ];
    form.querySelector("[data-review]").innerHTML = rows
      .map(function (r) {
        return (
          '<div><p class="rv-k">' + r[0] + '</p><p class="rv-v">' + esc(r[1] || "") + "</p>" +
          (r[2] ? '<button type="button" data-goto="' + index(r[2]) + '">Change<span class="hp"> ' + r[0] + "</span></button>" : "") +
          "</div>"
        );
      })
      .join("");
  }

  function setError(step, msg, field) {
    var e = step.querySelector("[data-error]");
    step.querySelectorAll("[aria-invalid]").forEach(function (f) { f.removeAttribute("aria-invalid"); });
    if (!msg) { e.hidden = true; e.textContent = ""; return true; }
    e.textContent = msg;
    e.hidden = false;
    if (field) { field.setAttribute("aria-invalid", "true"); field.focus(); }
    return false;
  }

  function validate(step) {
    var key = step.dataset.step;
    if (key === "address") {
      var a = form.address.value.trim();
      if (a.length < 5 || !/\d/.test(a)) return setError(step, "Please type your street address, with the house number.", form.address);
    }
    if (key === "plan" && !val("plan")) return setError(step, "Please choose one-time or whole winter.");
    if (key === "driveway" && !val("driveway")) return setError(step, "Please choose your driveway size.");
    if (key === "sidewalk" && !val("sidewalk")) return setError(step, "Please choose one. Pick “No sidewalk” if there isn’t one.");
    if (key === "walkway" && !val("walkway")) return setError(step, "Please choose one. Pick “No walkway” if there isn’t one.");
    if (key === "contact") {
      if (form.name.value.trim().length < 2) return setError(step, "Please type your name.", form.name);
      if (form.phone.value.replace(/\D/g, "").length < 10) return setError(step, "Please type your phone number with the area code, like 306 555 0123.", form.phone);
      var em = form.email.value.trim();
      if (em && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError(step, "That email doesn’t look right. You can also leave it empty.", form.email);
      if (form.forOther.checked && form.otherName.value.trim().length < 2) return setError(step, "Please type the name of the person you’re booking for.", form.otherName);
    }
    return setError(step, "");
  }

  function show(i, focus) {
    current = Math.max(0, Math.min(steps.length - 1, i));
    steps.forEach(function (s, n) { s.classList.toggle("current", n === current); });
    bars.forEach(function (b, n) {
      b.classList.toggle("done", n < current);
      b.classList.toggle("now", n === current);
    });
    countEl.textContent = "Step " + (current + 1) + " of " + steps.length;
    back.hidden = current === 0;
    var last = current === steps.length - 1;
    if (last) backToReview = false;
    next.innerHTML = last
      ? "Send my booking"
      : backToReview
        ? "Back to my booking"
        : steps[current].dataset.step === "extras" && !form.steps.checked && !form.iceMelt.checked
          ? "Skip"
          : "Next";
    if (last) review();
    document.body.classList.toggle("on-review", last);
    if (focus) {
      // Phones: keep the drawing strip in view above the question so each choice visibly clears.
      var top = form.getBoundingClientRect().top + window.scrollY - (window.innerWidth <= 600 ? 80 : 96);
      if (window.scrollY > top || window.innerWidth <= 600) window.scrollTo({ top: top });
      steps[current].querySelector("legend").focus({ preventScroll: true });
    }
  }

  document.documentElement.classList.add("js");
  form.addEventListener("change", function () {
    update();
    show(current, false);
  });
  form.addEventListener("input", function (e) {
    if (e.target.matches(".input")) e.target.removeAttribute("aria-invalid");
  });
  back.addEventListener("click", function () { show(current - 1, true); });
  form.addEventListener("click", function (e) {
    var b = e.target.closest("[data-goto]");
    if (b) {
      backToReview = true;
      show(Number(b.dataset.goto), true);
    }
  });
  form.addEventListener("submit", function (e) {
    if (current < steps.length - 1) {
      e.preventDefault();
      if (validate(steps[current])) show(backToReview ? steps.length - 1 : current + 1, true);
      return;
    }
    // Last step: check every step once more before sending.
    for (var i = 0; i < steps.length; i++) {
      if (!validate(steps[i])) {
        e.preventDefault();
        show(i, true);
        validate(steps[i]);
        return;
      }
    }
    next.disabled = true;
    next.textContent = "Sending…";
  });

  update();
  show(0, false);
})();
