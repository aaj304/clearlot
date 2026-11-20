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
  var wo = form.querySelector(".wo");
  var MONTHS = prices.months;
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

    // The work order: one line per chosen surface with its price, then the total.
    var p = prices[s.plan || "once"];
    var lines = [];
    if (s.driveway) lines.push([LABELS["driveway:" + s.driveway], p.driveway[s.driveway]]);
    if (s.sidewalk && s.sidewalk !== "none") lines.push([LABELS["sidewalk:" + s.sidewalk], p.sidewalk[s.sidewalk]]);
    if (s.walkway && s.walkway !== "none") lines.push([LABELS["walkway:" + s.walkway], p.walkway[s.walkway]]);
    if (s.steps) lines.push(["Front steps", p.steps]);
    if (s.iceMelt) lines.push(["Ice melt", p.iceMelt]);
    wo.querySelector("[data-lines]").innerHTML = lines
      .map(function (l) { return "<div><dt>" + l[0] + "</dt><dd>" + money(l[1]) + "</dd></div>"; })
      .join("");
    var total = price(s);
    wo.querySelector("[data-total-row]").hidden = !s.driveway;
    wo.querySelector("[data-total]").textContent = money(total);
    wo.querySelector("[data-total-unit]").textContent = s.plan === "winter" ? "Whole winter, plus GST" : "Per visit, plus GST";
    wo.querySelector("[data-monthly]").textContent =
      s.plan === "winter" ? "or " + money(Math.round(total / MONTHS)) + " a month for " + MONTHS + " months" : "";

    var now = new Date();
    if (s.plan === "winter") {
      wo.querySelector("[data-booked]").textContent = "Today";
      wo.querySelector("[data-cleared]").textContent = "24 h after each snowfall";
    } else {
      wo.querySelector("[data-booked]").textContent = window.clearlotTime(now);
      wo.querySelector("[data-cleared]").textContent = window.clearlotTime(new Date(now.getTime() + 864e5));
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
    var who = form.name.value.trim() + ", " + form.phone.value.trim() + ", " + form.email.value.trim();
    if (form.forOther.checked && form.otherName.value.trim()) who += " (for " + form.otherName.value.trim() + ")";
    var rows = [
      ["Address", form.address.value.trim() + ", Regina", "address"],
      ["How often", LABELS["plan:" + s.plan], "plan"],
      ["Driveway", LABELS["driveway:" + s.driveway], "driveway"],
      ["Sidewalk", LABELS["sidewalk:" + s.sidewalk], "sidewalk"],
      ["Walkway", LABELS["walkway:" + s.walkway], "walkway"],
      ["Extras", extras.length ? extras.join(", ") : "None", "extras"],
      ["Contact", who, "contact"],
      ["Price", money(price(s)) + (s.plan === "winter" ? " for the winter, or " + money(Math.round(price(s) / MONTHS)) + " a month for " + MONTHS + " months" : " per visit") + ", plus GST", null],
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
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) return setError(step, em ? "That email doesn’t look right. Please check it." : "Please type your email. We send your booking confirmation there.", form.email);
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

  // ---------- Address suggestions (Google Places, through /api/address.php) ----------
  var input = form.address;
  var list = document.getElementById("address-list");
  var hint = form.querySelector("[data-ac-hint]");
  var items = [];
  var active = -1;
  var enabled = true;
  var timer = null;
  var seq = 0;
  var session = newSession();

  function newSession() {
    return window.crypto && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2);
  }
  function close() {
    list.hidden = true;
    input.setAttribute("aria-expanded", "false");
    input.removeAttribute("aria-activedescendant");
    active = -1;
  }
  function render() {
    if (!items.length) return close();
    list.innerHTML =
      items
        .map(function (it, i) {
          return '<li role="option" id="ac-' + i + '" aria-selected="' + (i === active) + '" data-i="' + i + '"><strong>' + esc(it.main) + "</strong><span>" + esc(it.secondary) + "</span></li>";
        })
        .join("") + '<li class="ac-credit" aria-hidden="true">Address suggestions by Google</li>';
    list.hidden = false;
    input.setAttribute("aria-expanded", "true");
    if (active >= 0) input.setAttribute("aria-activedescendant", "ac-" + active);
    else input.removeAttribute("aria-activedescendant");
  }
  function choose(i) {
    var it = items[i];
    if (!it) return;
    input.value = it.main;
    form.placeId.value = it.id;
    close();
    items = [];
    hint.hidden = true;
    fetch("/api/address.php?place=" + encodeURIComponent(it.id) + "&session=" + session)
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.address) input.value = d.address;
        if (d.postal && !form.postal.value) form.postal.value = d.postal;
        if (d.inRegina === false) setError(steps[0], "That address looks like it’s outside Regina. We only clear homes inside the city for now.", input);
      })
      .catch(function () {})
      .then(function () { session = newSession(); });
  }

  input.setAttribute("role", "combobox");
  input.setAttribute("aria-autocomplete", "list");
  input.setAttribute("aria-controls", "address-list");
  input.setAttribute("aria-expanded", "false");

  input.addEventListener("input", function () {
    form.placeId.value = "";
    if (!enabled) return;
    clearTimeout(timer);
    var q = input.value.trim();
    if (q.length < 3) { items = []; return close(); }
    timer = setTimeout(function () {
      var mine = ++seq;
      fetch("/api/address.php?q=" + encodeURIComponent(q) + "&session=" + session)
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (mine !== seq) return;
          if (d.enabled === false) { enabled = false; return close(); }
          items = d.suggestions || [];
          active = -1;
          hint.hidden = !items.length;
          render();
        })
        .catch(function () {});
    }, 250);
  });
  input.addEventListener("keydown", function (e) {
    if (list.hidden || !items.length) return;
    if (e.key === "ArrowDown") { e.preventDefault(); active = (active + 1) % items.length; render(); }
    else if (e.key === "ArrowUp") { e.preventDefault(); active = (active - 1 + items.length) % items.length; render(); }
    else if (e.key === "Enter" && active >= 0) { e.preventDefault(); choose(active); }
    else if (e.key === "Escape") { close(); }
  });
  list.addEventListener("pointerdown", function (e) { e.preventDefault(); });
  list.addEventListener("click", function (e) {
    var li = e.target.closest("[data-i]");
    if (li) choose(Number(li.dataset.i));
  });
  input.addEventListener("blur", function () { setTimeout(close, 150); });
})();
