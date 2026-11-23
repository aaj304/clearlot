import { CATALOG, priceFor } from "./catalog.mjs";
import { renderLot } from "./lot.mjs";
import { DIAGRAM, ICON, money, tel, workOrder } from "./ui.mjs";

export function buildPages(site, prices) {
  const P = prices;
  const cm = P.season.triggerCm;
  const seasonLabel = P.season.label;
  const months = P.season.months;
  const winterDesc = CATALOG.plan.winter.desc.replace("{cm}", cm).replace("{season}", seasonLabel) + `. We visit your home first and give you a free estimate for the winter`;
  // Whole-winter prices are never shown. We come out, look at the property and give an estimate.
  const estimateLine = "We visit your home and give you a free estimate for the whole winter";
  const estimateCard = (heading = "Want us all winter? We’ll come and see your home first", tag = "h2") => `<div class="estimate-card">
  <div>
    <p class="eyebrow">Whole winter plan</p>
    <${tag}>${heading}</${tag}>
    <p class="text-2">Every home is different, so we don’t guess at a price for the season. We visit, look at your driveway, sidewalk and paths, and give you a free estimate for the whole winter before you decide. There’s no cost to ask.</p>
    <ul>
      <li>${ICON.check}<span>Cleared after every snowfall of ${cm} cm or more, ${seasonLabel}</span></li>
      <li>${ICON.check}<span>You never have to call us. We just come</span></li>
      <li>${ICON.check}<span>Pay all at once or month by month</span></li>
    </ul>
  </div>
  <a class="btn btn-primary" href="/book/?plan=winter">Ask for a free estimate ${ICON.right}</a>
</div>`;
  const phone = site.phone;
  const callBtn = (cls = "btn-quiet") => (phone ? `<a class="btn ${cls}" href="${tel(phone)}" data-call>${ICON.phone} Call ${phone}</a>` : "");
  const base = site.siteUrl.replace(/\/$/, "");

  // A few slow snowflakes for the home hero. Fixed values so every build is the same.
  const snow = `<div class="snow" aria-hidden="true">${Array.from({ length: 18 }, (_, i) => {
    const x = (i * 37 + 11) % 100;
    const size = 4 + ((i * 7) % 5);
    const t = 12 + ((i * 5) % 10);
    const w = -((i * 3.1) % t).toFixed(1);
    const d = ((i % 2 ? 1 : -1) * (10 + ((i * 13) % 30)));
    return `<i style="left:${x}%;--s:${size}px;--t:${t}s;--w:${w}s;--drift:${d}px"></i>`;
  }).join("")}</div>`;
  const example = { driveway: "double", sidewalk: "regular", walkway: "regular" };
  const exOnce = priceFor(P, "once", example);

  const business = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${base}/#business`,
    name: site.name,
    url: `${base}/`,
    description: "Driveway, sidewalk and walkway snow removal for homes in Regina, Saskatchewan, cleared within 24 hours.",
    areaServed: { "@type": "City", name: "Regina", containedInPlace: { "@type": "AdministrativeArea", name: "Saskatchewan" } },
    priceRange: "$$",
    ...(phone ? { telephone: phone } : {}),
    ...(site.publicEmail ? { email: site.publicEmail } : {}),
  };
  const service = (name, desc, path) => ({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: name,
    name: `${name} in Regina`,
    description: desc,
    url: `${base}${path}`,
    provider: { "@id": `${base}/#business` },
    areaServed: { "@type": "City", name: "Regina" },
  });

  // ---------- FAQ content, shared by several pages ----------
  const FAQ = [
    ["How fast will you clear my snow?", `<p>For a one-time clearing, within 24 hours of your booking. On the whole winter plan, within 24 hours after each snowfall of ${cm} cm or more stops.</p>`],
    ["How do I know what size my driveway is?", `<p>Count how many cars fit side by side. One car wide is a single driveway, two is a double and three is a triple. If you also have a pad for an RV, trailer or boat beside the driveway, pick extra-long or RV pad.</p><p>Not sure? Pick the closest one. We check when we call to confirm.</p>`],
    ["What is a corner lot sidewalk?", `<p>If your home is on a corner, there is city sidewalk along the front and along the side of your lot. Pick corner lot sidewalk and we clear both.</p>`],
    ["Do I need to be home?", `<p>No. If we need to get through a gate, add the gate code or where the latch is in your booking notes.</p>`],
    ["How do I pay?", `<p>Nothing is charged online. After you book, we call you to confirm the details and arrange payment.</p>`],
    ["Can I book for my parents or a neighbour?", `<p>Yes. In the booking, tick “I’m booking for someone else” and add their name and phone number. We can call you, them, or both.</p>`],
    ["What does the whole winter plan cover?", `<p>Every snowfall of ${cm} cm or more from ${seasonLabel}, for the areas you picked. We visit your home first and give you a free estimate, one price for the winter, and it does not go up if it snows a lot. Pay it all at once, or month by month from November to March.</p>`],
    ["How much is the whole winter plan?", `<p>Every home is different, so we come out, look at your driveway, sidewalk and paths, and give you a free estimate for the whole winter before you decide. Ask for one in the booking by choosing “Whole winter”.</p>`],
    ["What is the difference between one-time and whole winter?", `<p>One-time is a single visit after a snowfall, when you need it. Whole winter means you don’t have to remember to book: we come after every snowfall of ${cm} cm or more.</p>`],
    ["Do you use ice melt?", `<p>Only if you ask for it. Add ice melt in the extras step and we spread it on your driveway and paths after clearing.</p>`],
    ["Do prices include GST?", `<p>No. Prices are in Canadian dollars, and 5% GST is added.</p>`],
    ["Which areas do you serve?", `<p>Homes inside Regina city limits. See <a href="/areas-we-serve/">areas we serve</a> for the neighbourhoods.</p>`],
    ["How do I change or cancel a booking?", phone ? `<p>Call us at <a href="${tel(phone)}" data-call>${phone}</a>.</p>` : `<p>Reply to your booking confirmation or use the details on our <a href="/contact/">contact page</a>.</p>`],
  ];
  const faqList = (items) =>
    `<div class="faq">${items
      .map(([q, a]) => `<details><summary>${q}${ICON.plus}</summary><div class="answer">${a}</div></details>`)
      .join("")}</div>`;
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a.replace(/<[^>]+>/g, "") } })),
  };

  const ctaBand = (title = "Get your snow cleared within 24 hours") => `<section class="section-tight on-navy">
  <div class="wrap cta-row">
    <div><h2>${title}</h2><p class="cta-sub">We call you before we come, and nothing is charged online.</p></div>
    <div class="hero-actions" style="margin-top:0!important">
      <a class="btn btn-primary" href="/book/">Book snow removal</a>
      ${callBtn()}
    </div>
  </div>
</section>`;

  const priceRows = (key) =>
    Object.entries(CATALOG[key])
      .filter(([v]) => v !== "none")
      .map(([v, o]) => `<tr><th scope="row">${o.label}<span>${o.desc}</span></th><td class="amount">${money(P.once[key][v])}</td></tr>`)
      .join("");
  const extraRows = Object.entries(CATALOG.extras)
    .map(([k, o]) => `<tr><th scope="row">${o.label}<span>${o.desc}</span></th><td class="amount">${money(P.once[k])}</td></tr>`)
    .join("");
  const rateNote = `<p class="rate-note"><strong>Whole winter plan:</strong> ${estimateLine.toLowerCase()}. <a href="/book/?plan=winter">Ask for a free estimate</a></p>`;
  const rateTable = (caption, head, rows) => `<div><table class="rate">
  <caption>${caption}</caption>
  <thead><tr><th scope="col">${head}</th><th scope="col" class="amount">One time</th></tr></thead>
  <tbody>${rows}</tbody>
</table>${rateNote}</div>`;
  const fullPriceTable = rateTable("Rate card", "What we clear", `
    <tr class="group"><th colspan="2" scope="colgroup">Driveway (pick one)</th></tr>${priceRows("driveway")}
    <tr class="group"><th colspan="2" scope="colgroup">Sidewalk (add on)</th></tr>${priceRows("sidewalk")}
    <tr class="group"><th colspan="2" scope="colgroup">Walkway (add on)</th></tr>${priceRows("walkway")}
    <tr class="group"><th colspan="2" scope="colgroup">Extras</th></tr>${extraRows}`);
  const exampleBox = `<div class="example">
  <p class="text-2">Example: a double driveway, a regular sidewalk and a front walkway</p>
  <div><strong>${money(exOnce)}</strong><span class="muted">one time</span></div>
  <div><strong class="example-est">Whole winter</strong><span class="muted">free estimate at your home</span></div>
</div>`;

  const optionCard = (name, value, o, diagram, { type = "radio", once, winter, unit = true } = {}) => {
    const priceHtml =
      once === undefined
        ? ""
        : once === 0 && winter === 0
          ? `<span class="option-price"><small>No charge</small></span>`
          : `<span class="option-price"><span data-show-plan="once">${unit ? "" : "+"}${money(once)}<small>${unit ? "per visit" : "per visit"}</small></span><span data-show-plan="winter"><small>Free estimate</small></span></span>`;
    return `<label class="option">
  <input type="${type}" name="${name}" value="${value}"${type === "radio" ? " required" : ""}>
  ${diagram}
  <span><span class="option-title">${o.label}</span><span class="option-desc">${o.desc}</span></span>
  ${priceHtml}
  <span class="option-check">${ICON.check}</span>
</label>`;
  };

  const AREAS = [
    "Albert Park", "Al Ritchie", "Arcola East", "Argyle Park", "Boothill", "Cathedral", "Coronation Park", "Creekside",
    "Dewdney East", "Dieppe", "Downtown", "Eastview", "Glencairn", "Glen Elm Park", "Greens on Gardiner", "Harbour Landing",
    "Hawkstone", "Heritage", "Hillsdale", "Kensington Greens", "Lakeridge", "Lakeview", "Lakewood", "Mount Royal",
    "Normanview", "Normanview West", "North Central", "Rosemont", "Regent Park", "River Bend", "Rochdale Park", "Sherwood Estates",
    "Twin Lakes", "University Park", "Uplands", "Walsh Acres", "Wascana View", "Westerra", "Whitmore Park", "Windsor Park",
  ];

  const pages = [];

  // ---------- Home ----------
  pages.push({
    path: "/",
    title: "Snow Removal in Regina | Cleared Within 24 Hours | ClearLot YQR",
    description: `Driveway, sidewalk and walkway snow removal in Regina, cleared within 24 hours of booking. See your price in two minutes. One-time or whole winter.`,
    schema: [business],
    body: `<section class="hero">
  ${snow}
  <div class="wrap">
    <div class="hero-top">
      <div>
        <p class="eyebrow">Snow removal in Regina</p>
        <h1 style="margin-top:16px">Cleared within 24 hours of booking</h1>
      </div>
      <div class="hero-side">
        <p class="lede">Driveways, city sidewalks and walkways for Regina homes. Pick your sizes, see the exact price on your work order, and we clear it within a day.</p>
        <div class="hero-actions">
          <a class="btn btn-primary" href="/book/">Book snow removal ${ICON.right}</a>
          ${phone ? callBtn() : `<a class="btn btn-quiet" href="/prices/">See prices</a>`}
        </div>
        <p class="hero-note">No account to set up. Nothing to pay online.</p>
      </div>
    </div>
    <ul class="assure">
      <li>${ICON.check}<span>Cleared within 24 hours</span></li>
      <li>${ICON.check}<span>We call you before we come</span></li>
      <li>${ICON.check}<span>You pay after we confirm</span></li>
    </ul>
    <div class="sheet">
      <div class="sheet-plan">
        ${renderLot({ driveway: "double", sidewalk: "regular", walkway: "regular", steps: true }, "hero")}
        <p class="sheet-caption"><span>Site plan, example home</span><span>Orange is what we clear</span></p>
      </div>
      <div class="sheet-side">
        ${workOrder({
          ref: "Example",
          lines: [
            ["Double driveway", money(P.once.driveway.double)],
            ["Regular sidewalk", money(P.once.sidewalk.regular)],
            ["Front walkway", money(P.once.walkway.regular)],
            ["Front steps", money(P.once.steps)],
          ],
          total: money(exOnce + P.once.steps),
          unit: "Per visit, plus GST",
          monthly: "Whole winter: free estimate at your home",
          booked: "Now",
          cleared: "Within 24 hours",
          live: true,
        })}
      </div>
    </div>
  </div>
</section>

<section class="section section-rule">
  <div class="wrap">
    <div class="section-head">
      <h2>Booked in about two minutes</h2>
      <p class="lede">One question at a time, in large print. If you’d rather talk to a person, ${phone ? `call <a href="${tel(phone)}" data-call>${phone}</a>` : "you can call us"}.</p>
    </div>
    <ol class="steps">
      <li><div><h3>Tell us your address</h3><p class="text-2">Any home inside Regina city limits.</p></div></li>
      <li><div><h3>Pick your sizes</h3><p class="text-2">Single, double or triple driveway. Regular or corner lot sidewalk. A front walkway if you have one.</p></div></li>
      <li><div><h3>We call to confirm, then clear it</h3><p class="text-2">Cleared within 24 hours of booking. You pay after we confirm.</p></div></li>
    </ol>
  </div>
</section>

<section class="section">
  <div class="wrap split">
    <div class="section-head side">
      <h2>Your price depends on your driveway</h2>
      <p class="lede">Pick your size to start a booking. Add your sidewalk and walkway on the next steps. Prices are plus GST.</p>
      <p><a class="btn btn-quiet" href="/prices/">See every price</a></p>
    </div>
    <div class="stack">
      <div class="options">
        ${Object.entries(CATALOG.driveway)
          .map(([v, o]) => `<a class="option" href="/book/?driveway=${v}">${DIAGRAM[v]}<span><span class="option-title">${o.label}</span><span class="option-desc">${o.desc}</span></span><span class="option-price">${money(P.once.driveway[v])}<small>per visit</small></span></a>`)
          .join("")}
      </div>
      <div style="margin-top:32px">${exampleBox}</div>
    </div>
  </div>
</section>

<section class="section on-navy">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">Our promise</p>
      <h2>What 24 hours means</h2>
    </div>
    <div class="promise-grid">
      <div>
        <p class="promise-figure num">24 h</p>
        <h3>One-time clearing</h3>
        <p class="text-2">Book any time. Your driveway, sidewalk and walkway are cleared within 24 hours of your booking.</p>
      </div>
      <div>
        <p class="promise-figure num">${cm} cm</p>
        <h3>Whole winter</h3>
        <p class="text-2">After every snowfall of ${cm} cm or more, from ${seasonLabel}, we clear your home within 24 hours after the snow stops. You don’t have to call. We visit first and give you a free estimate.</p>
      </div>
    </div>
  </div>
</section>

<section class="section" style="padding-bottom:0">
  <div class="wrap">${estimateCard()}</div>
</section>

<section class="section">
  <div class="wrap split-even split">
    <div class="section-head" style="margin-bottom:0">
      <h2>Booking for a parent?</h2>
      <p class="lede">You can book snow removal for someone else. Tick “I’m booking for someone else”, add their name and number, and tell us who to call.</p>
      <p><a class="btn btn-quiet" href="/snow-removal-for-seniors/">Snow removal for seniors</a></p>
    </div>
    <div class="link-rows">
      <a href="/driveway-snow-removal/"><span><strong>Driveway snow removal</strong><span class="text-2">Single, double, triple and RV pads</span></span>${ICON.right}</a>
      <a href="/sidewalk-snow-removal/"><span><strong>Sidewalk snow removal</strong><span class="text-2">Regular and corner lot sidewalks</span></span>${ICON.right}</a>
      <a href="/areas-we-serve/"><span><strong>Areas we serve</strong><span class="text-2">Every neighbourhood in Regina</span></span>${ICON.right}</a>
    </div>
  </div>
</section>

<section class="section section-rule">
  <div class="wrap split">
    <div class="section-head">
      <h2>Questions people ask</h2>
      <p><a href="/faq/">See all questions</a></p>
    </div>
    ${faqList([FAQ[0], FAQ[1], FAQ[4], FAQ[7], FAQ[6]])}
  </div>
</section>

${ctaBand()}`,
  });

  // ---------- Booking ----------
  const step = (key, legend, help, inner) =>
    `<fieldset class="step" data-step="${key}"><legend tabindex="-1">${legend}</legend>${help ? `<p class="step-help">${help}</p>` : ""}${inner}<p class="error" role="alert" data-error hidden></p></fieldset>`;
  const radios = (key, diagrams) =>
    `<div class="options">${Object.entries(CATALOG[key])
      .map(([v, o]) => optionCard(key, v, o, DIAGRAM[diagrams[v]], { once: P.once[key][v], winter: P.winter[key][v], unit: key === "driveway" }))
      .join("")}</div>`;

  pages.push({
    path: "/book/",
    title: "Book Snow Removal in Regina | ClearLot YQR",
    description: "Book driveway, sidewalk and walkway snow removal in Regina. Pick your sizes, see your price and get cleared within 24 hours.",
    bodyClass: "page-book",
    scripts: `<script src="/assets/book.js?v=${prices.__version}" defer></script>`,
    body: `<section class="book">
  <div class="wrap">
    <form id="book-form" class="book-grid" method="post" action="/api/book.php" novalidate data-plan="">
      <div>
        <div class="progress" aria-hidden="true">${Array.from({ length: 8 }, () => "<span></span>").join("")}</div>
        <p class="step-count" aria-live="polite" data-step-count>Book snow removal</p>
        <div style="margin-top:20px">
          ${step(
            "address",
            "What’s the address?",
            "Where should we clear the snow?",
            `<div class="field"><label for="address">Street address</label><div class="ac"><input class="input" id="address" name="address" autocomplete="street-address" placeholder="Start typing, for example 2405 Albert St" required maxlength="160"><ul class="ac-list" id="address-list" role="listbox" aria-label="Suggested addresses" hidden></ul></div><p class="hint" data-ac-hint hidden>Pick your address from the list, or keep typing</p></div>
             <input type="hidden" name="placeId" value=""><input type="hidden" name="postal" value="">
             <p class="city-fixed">${ICON.pin} Regina, Saskatchewan</p>`,
          )}
          ${step(
            "plan",
            "How often do you need us?",
            "",
            `<div class="options">
              ${optionCard("plan", "once", CATALOG.plan.once, DIAGRAM.once)}
              ${optionCard("plan", "winter", { label: CATALOG.plan.winter.label, desc: winterDesc }, DIAGRAM.winter)}
            </div>`,
          )}
          ${step("driveway", "How big is your driveway?", "Count how many cars fit side by side.", radios("driveway", { single: "single", double: "double", triple: "triple", rv: "rv" }))}
          ${step("sidewalk", "Is there a city sidewalk?", "If your home is on a corner, the sidewalk runs along two sides.", radios("sidewalk", { none: "sidewalkNone", regular: "sidewalkRegular", corner: "sidewalkCorner" }))}
          ${step("walkway", "Do you have a walkway?", "The path people walk on to reach your door.", radios("walkway", { none: "walkwayNone", regular: "walkwayRegular", long: "walkwayLong" }))}
          ${step(
            "extras",
            "Anything else?",
            "These are optional. Skip this step if you don’t need them.",
            `<div class="options">${Object.entries(CATALOG.extras)
              .map(([k, o]) => optionCard(k, "1", o, DIAGRAM[k], { type: "checkbox", once: P.once[k], winter: P.winter[k], unit: false }))
              .join("")}</div>`,
          )}
          ${step(
            "contact",
            "How can we reach you?",
            "We email you a confirmation and call to confirm before we come.",
            `<div class="field"><label for="name">Your name</label><input class="input" id="name" name="name" autocomplete="name" required maxlength="80"></div>
             <div class="field"><label for="phone">Phone number</label><input class="input" id="phone" name="phone" type="tel" autocomplete="tel" required maxlength="30" placeholder="306 555 0123"></div>
             <div class="field"><label for="email">Email <span class="hint">(we send your booking confirmation here)</span></label><input class="input" id="email" name="email" type="email" autocomplete="email" required maxlength="120"></div>
             <label class="check"><input type="checkbox" name="forOther" value="1" data-for-other><span>I’m booking for someone else<span>A parent, relative or neighbour</span></span></label>
             <div data-other-fields>
               <div class="field"><label for="otherName">Their name</label><input class="input" id="otherName" name="otherName" maxlength="80"></div>
               <div class="field"><label for="otherPhone">Their phone number <span class="hint">(optional)</span></label><input class="input" id="otherPhone" name="otherPhone" type="tel" maxlength="30"></div>
             </div>
             <div class="field"><label for="notes">Anything we should know? <span class="hint">(optional)</span></label><textarea class="input" id="notes" name="notes" maxlength="600" placeholder="Gate code, where to pile the snow, a car that’s always parked outside"></textarea></div>`,
          )}
          ${step(
            "review",
            "Check your booking",
            "",
            `<div class="book-review" data-review><div><p class="rv-k">Your booking</p><p class="rv-v">Fill in the steps above, then send</p></div></div>
             <p class="text-2" style="margin-top:20px" data-review-note>We’ll call you to confirm before we come. Nothing is charged now.</p>`,
          )}
          <input type="hidden" name="started" value="">
          <div class="hp" aria-hidden="true"><label for="website">Leave this empty</label><input id="website" name="website" tabindex="-1" autocomplete="off"></div>
          <div class="book-nav">
            <button type="button" class="btn btn-quiet" data-back hidden>${ICON.left} Back</button>
            <button type="submit" class="btn btn-primary" data-next>Send my booking</button>
          </div>
        </div>
      </div>
      <aside class="book-side" aria-label="Your booking so far">
        <div class="plan-frame">${renderLot({}, "book", { title: "Drawing of your home. Each part clears as you choose it", crop: true })}</div>
        ${workOrder({ ref: "Draft", booked: "Now", cleared: "Within 24 hours", unit: "Per visit, plus GST" })}
      </aside>
    </form>
  </div>
</section>
<script type="application/json" id="prices">${JSON.stringify({ once: P.once, gst: P.gst, months })}</script>`,
  });

  // ---------- Thank you ----------
  pages.push({
    path: "/thank-you/",
    title: "Booking received | ClearLot YQR",
    description: "Your snow removal booking has been received.",
    noindex: true,
    scripts: `<script src="/assets/thanks.js?v=${prices.__version}" defer></script>${
      site.googleAdsId && site.bookingConversionLabel
        ? `<script>window.__conversion=${JSON.stringify(`${site.googleAdsId}/${site.bookingConversionLabel}`)};</script>`
        : ""
    }`,
    body: `<section class="section">
  <div class="wrap done-grid">
    <div class="stack">
      <p class="eyebrow">Booking received</p>
      <h1>Thank you. We have your booking.</h1>
      <p class="lede">We’ll call you to confirm the details before we come. Nothing has been charged.</p>
      <p class="text-2" data-mail-line hidden>A confirmation email is on its way. If you don’t see it in a few minutes, check your junk or spam folder.</p>
      <p class="text-2" data-ref-line hidden>Your booking number is <strong data-ref></strong>.</p>
      <ol class="steps vertical" style="margin-top:40px">
        <li><div><h3>We call you</h3><p class="text-2" data-call-text>To confirm your address, your sizes and the price.</p></div></li>
        <li><div><h3>We clear the snow</h3><p class="text-2" data-plan-text>Within 24 hours of your booking.</p></div></li>
        <li><div><h3>You pay</h3><p class="text-2" data-pay-text>We arrange payment when we call.</p></div></li>
      </ol>
      ${phone ? `<p class="text-2" style="margin-top:24px">Questions? Call <a href="${tel(phone)}" data-call>${phone}</a>.</p>` : ""}
    </div>
    <div>${workOrder({ ref: "", booked: "Just now", cleared: "Within 24 hours" })}</div>
  </div>
</section>`,
  });

  // ---------- Driveways ----------
  pages.push({
    path: "/driveway-snow-removal/",
    title: "Driveway Snow Removal in Regina | Single, Double, Triple | ClearLot YQR",
    description: `Driveway snow removal in Regina from ${money(P.once.driveway.single)} per visit. Single, double, triple and RV pads, cleared within 24 hours. One-time or whole winter.`,
    schema: [service("Driveway snow removal", "Driveway snow clearing for Regina homes, cleared within 24 hours of booking.", "/driveway-snow-removal/")],
    body: `<section class="page-head"><div class="wrap">
  <p class="eyebrow">Driveways</p>
  <h1>Driveway snow removal in Regina</h1>
  <p class="lede">We clear your driveway from the garage to the street, edge to edge, within 24 hours of your booking. Pick your size and see the price before you book.</p>
  <div class="hero-actions"><a class="btn btn-primary" href="/book/">Book driveway clearing</a>${callBtn()}</div>
</div></section>
<section class="section section-rule">
  <div class="wrap split">
    <div class="section-head">
      <h2>Which size is my driveway?</h2>
      <p class="lede">Count how many cars fit side by side. If you’re between two sizes, pick the bigger one or call us.</p>
    </div>
    <div class="options">
      ${Object.entries(CATALOG.driveway)
        .map(([v, o]) => `<a class="option" href="/book/?driveway=${v}" style="text-decoration:none">${DIAGRAM[v]}<span><span class="option-title">${o.label}</span><span class="option-desc">${o.desc}</span></span><span class="option-price">${money(P.once.driveway[v])}<small>per visit</small></span></a>`)
        .join("")}
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap split">
    <div class="prose">
      <h2>What’s included</h2>
      <ul>
        <li>The full width of your driveway, from the garage door to the street</li>
        <li>Snow piled neatly to the side, not onto your sidewalk or walkway</li>
        <li>Add your city sidewalk, walkway, front steps or ice melt when you book</li>
      </ul>
      <h2>One time or all winter</h2>
      <p>Book a one-time clearing whenever you need it, and we come within 24 hours. Or choose the whole winter plan and we clear your driveway after every snowfall of ${cm} cm or more, from ${seasonLabel}, without you having to call.</p>
    </div>
    ${rateTable("Driveway prices", "Size", priceRows("driveway"))}
  </div>
</section>
${ctaBand("Book your driveway clearing")}`,
  });

  // ---------- Sidewalks ----------
  pages.push({
    path: "/sidewalk-snow-removal/",
    title: "Sidewalk Snow Removal in Regina | Regular and Corner Lots | ClearLot YQR",
    description: "City sidewalk snow removal for Regina homes, including corner lots. Add it to your driveway clearing and get it done within 24 hours.",
    schema: [service("Sidewalk snow removal", "Clearing the city sidewalk beside Regina homes, including corner lots, within 24 hours of booking.", "/sidewalk-snow-removal/")],
    body: `<section class="page-head"><div class="wrap">
  <p class="eyebrow">Sidewalks</p>
  <h1>Sidewalk snow removal in Regina</h1>
  <p class="lede">A cleared sidewalk means your neighbours, mail carrier and delivery drivers can walk past your home safely. Add it to your driveway booking and we clear both within 24 hours.</p>
  <div class="hero-actions"><a class="btn btn-primary" href="/book/">Book snow removal</a>${callBtn()}</div>
</div></section>
<section class="section section-rule">
  <div class="wrap split">
    <div class="section-head">
      <h2>Regular or corner lot?</h2>
      <p class="lede">Most homes have sidewalk across the front. Homes on a corner have sidewalk along the front and the side, which is about twice as much to clear.</p>
    </div>
    <div class="options">
      ${["regular", "corner"]
        .map((v) => `<div class="option" style="cursor:default">${DIAGRAM[v === "regular" ? "sidewalkRegular" : "sidewalkCorner"]}<span><span class="option-title">${CATALOG.sidewalk[v].label}</span><span class="option-desc">${CATALOG.sidewalk[v].desc}</span></span><span class="option-price">+${money(P.once.sidewalk[v])}<small>per visit</small></span></div>`)
        .join("")}
    </div>
  </div>
</section>
<section class="section">
  <div class="wrap split">
    <div class="prose">
      <h2>How it works</h2>
      <p>The sidewalk is an add-on to driveway clearing. When you book, pick your driveway size, then regular or corner lot sidewalk. We clear the stretch of sidewalk beside your property, edge to edge.</p>
      <p>On the whole winter plan, your sidewalk is cleared after every snowfall of ${cm} cm or more, along with your driveway.</p>
    </div>
    ${rateTable("Sidewalk prices", "Sidewalk", priceRows("sidewalk"))}
  </div>
</section>
${ctaBand()}`,
  });

  // ---------- Seniors ----------
  pages.push({
    path: "/snow-removal-for-seniors/",
    title: "Snow Removal for Seniors in Regina | Easy Booking | ClearLot YQR",
    description: "Snow removal for seniors in Regina. Book by phone or online, or let a family member book for you. Driveway, sidewalk and walkway cleared within 24 hours.",
    schema: [service("Snow removal for seniors", "Simple snow removal booking for seniors in Regina, with the option for family to book on their behalf.", "/snow-removal-for-seniors/")],
    body: `<section class="page-head"><div class="wrap">
  <p class="eyebrow">For seniors and their families</p>
  <h1>Snow removal for seniors in Regina</h1>
  <p class="lede">Stay inside where it’s warm. We clear your driveway, sidewalk and front walkway within 24 hours of your booking.</p>
  <div class="hero-actions">${phone ? callBtn("btn-primary") + `<a class="btn btn-quiet" href="/book/">Book online</a>` : `<a class="btn btn-primary" href="/book/">Book online</a>`}</div>
</div></section>
${
  phone
    ? `<section class="section-tight"><div class="wrap"><div class="call-panel"><div><p class="text-2">Prefer to talk to a person?</p><a class="call-number" href="${tel(phone)}" data-call>${phone}</a></div><p class="text-2" style="max-width:26rem">Call and we’ll take your booking over the phone. No computer needed.</p></div></div></section>`
    : ""
}
<section class="section">
  <div class="wrap split">
    <div class="section-head side"><h2>What to expect</h2></div>
    <ol class="steps vertical">
      <li><div><h3>You book</h3><p class="text-2">${phone ? "By phone or online. " : "Online, one question at a time. "}There’s no account to set up and nothing to download.</p></div></li>
      <li><div><h3>We call you to confirm</h3><p class="text-2">We go over your address, what you’d like cleared and the price, so there are no surprises.</p></div></li>
      <li><div><h3>We clear the snow</h3><p class="text-2">Within 24 hours of your booking. You don’t need to be home.</p></div></li>
      <li><div><h3>You pay after we confirm</h3><p class="text-2">Nothing is charged online. We arrange payment when we call.</p></div></li>
    </ol>
  </div>
</section>
<section class="section section-rule">
  <div class="wrap split">
    <div class="section-head">
      <h2>Booking for a parent or neighbour</h2>
      <p class="lede">Family members can book for someone else. In the booking, tick “I’m booking for someone else” and add their name and phone number.</p>
    </div>
    <div class="prose">
      <p>Tell us in the notes who we should call to confirm, you or them, and anything we should know about the home, like a gate code or where to put the snow.</p>
      <p>The whole winter plan works well for parents: we come after every snowfall of ${cm} cm or more, so nobody has to remember to call.</p>
      <p><a class="btn btn-primary" href="/book/">Book for someone else</a></p>
    </div>
  </div>
</section>
<section class="section" style="padding-bottom:0">
  <div class="wrap">${estimateCard("Peace of mind all winter long")}</div>
</section>
<section class="section">
  <div class="wrap split">
    <div class="section-head"><h2>Common questions</h2></div>
    ${faqList([FAQ[5], FAQ[3], FAQ[4], FAQ[7]])}
  </div>
</section>
${ctaBand("We’ll take care of the snow")}`,
  });

  // ---------- Prices ----------
  pages.push({
    path: "/prices/",
    title: "Snow Removal Prices in Regina | ClearLot YQR",
    description: `Snow removal prices in Regina. Driveways from ${money(P.once.driveway.single)} per visit. Sidewalk, walkway and extras listed. Free estimates for whole winter plans. Plus GST.`,
    body: `<section class="page-head"><div class="wrap">
  <h1>Snow removal prices</h1>
  <p class="lede">One-time prices are below: pick your driveway size, then add your sidewalk, walkway and any extras. For the whole winter, we visit your home and give you a free estimate. Prices are in Canadian dollars, plus 5% GST.</p>
</div></section>
<section class="section-tight" style="padding-top:0">
  <div class="wrap split">
    <div class="stack">
      ${exampleBox}
      <div class="prose" style="margin-top:40px">
        <h3>One time</h3>
        <p>A single visit, cleared within 24 hours of your booking.</p>
        <h3>Whole winter</h3>
        <p>Every snowfall of ${cm} cm or more, from ${seasonLabel}, cleared within 24 hours after the snow stops. We visit your home first and give you a free estimate, one price for the winter. It does not go up if it snows a lot.</p>
        <p><a class="btn btn-quiet" href="/book/?plan=winter">Ask for a free estimate</a></p>
        <h3>Paying</h3>
        <p>Nothing is charged online. We call to confirm your booking and arrange payment. The whole winter plan can be paid all at once or month by month, November to March.</p>
      </div>
    </div>
    ${fullPriceTable}
  </div>
</section>
${ctaBand("Book in two minutes")}`,
  });

  // ---------- Areas ----------
  pages.push({
    path: "/areas-we-serve/",
    title: "Snow Removal Across Regina Neighbourhoods | ClearLot YQR",
    description: "Snow removal for homes across Regina, from Harbour Landing to Walsh Acres, Lakeview to Windsor Park. Cleared within 24 hours of booking.",
    schema: [business],
    body: `<section class="page-head"><div class="wrap">
  <h1>Snow removal across Regina</h1>
  <p class="lede">We clear homes inside Regina city limits. Here are some of the neighbourhoods we cover. If yours isn’t listed but you’re in Regina, you can still book.</p>
</div></section>
<section class="section-tight" style="padding-top:0">
  <div class="wrap">
    <ul class="areas">${AREAS.map((a) => `<li>${a}</li>`).join("")}</ul>
    <p class="text-2" style="margin-top:40px;max-width:40rem">Outside the city, such as White City, Emerald Park, Pilot Butte or Lumsden? ${phone ? `Call <a href="${tel(phone)}" data-call>${phone}</a> before booking.` : "Contact us before booking."}</p>
  </div>
</section>
${ctaBand()}`,
  });

  // ---------- FAQ ----------
  pages.push({
    path: "/faq/",
    title: "Snow Removal Questions | ClearLot YQR Regina",
    description: "Answers about our Regina snow removal: how fast we come, driveway sizes, corner lots, paying, booking for parents and the whole winter plan.",
    schema: [faqSchema],
    body: `<section class="page-head"><div class="wrap">
  <h1>Questions and answers</h1>
  <p class="lede">Can’t find your answer? ${phone ? `Call <a href="${tel(phone)}" data-call>${phone}</a>.` : `<a href="/contact/">Contact us</a>.`}</p>
</div></section>
<section class="section-tight" style="padding-top:0">
  <div class="wrap" style="max-width:860px">${faqList(FAQ)}</div>
</section>
${ctaBand()}`,
  });

  // ---------- Contact ----------
  pages.push({
    path: "/contact/",
    title: "Contact ClearLot YQR | Snow Removal in Regina",
    description: "Contact ClearLot YQR for snow removal in Regina. Call us or book online.",
    body: `<section class="page-head"><div class="wrap">
  <h1>Contact us</h1>
  <p class="lede">The quickest way to get your snow cleared is to book online. You can also reach us here.</p>
</div></section>
<section class="section-tight" style="padding-top:0">
  <div class="wrap stack" style="max-width:860px">
    ${phone ? `<div class="call-panel"><div><p class="text-2">Phone</p><a class="call-number" href="${tel(phone)}" data-call>${phone}</a></div></div>` : ""}
    ${site.publicEmail ? `<div class="call-panel"><div><p class="text-2">Email</p><a class="call-number" style="font-size:1.75rem" href="mailto:${site.publicEmail}">${site.publicEmail}</a></div></div>` : ""}
    <div class="call-panel"><div><p class="text-2">Book online</p><p class="call-number" style="font-size:1.75rem">Two minutes, any time</p></div><a class="btn btn-primary" href="/book/">Book snow removal</a></div>
  </div>
</section>`,
  });

  // ---------- Privacy ----------
  pages.push({
    path: "/privacy/",
    title: "Privacy | ClearLot YQR",
    description: "How ClearLot YQR handles the information you give us when you book snow removal.",
    body: `<section class="page-head"><div class="wrap"><h1>Privacy</h1></div></section>
<section class="section-tight" style="padding-top:0">
  <div class="wrap prose">
    <p>When you book, we collect your address, your name, your phone number, and your email if you give it, plus anything you write in the notes. If you book for someone else, we also collect their name and phone number.</p>
    <p>We use this only to confirm your booking, clear your snow and contact you about it. The crew doing the work sees your address and notes. We do not sell your information.</p>
    ${site.googleAdsId ? `<p>We use Google Ads to measure how many people book after clicking our ads. Google may set cookies for this. You can control ad personalisation in your Google account settings.</p>` : ""}
    <p>To see, correct or delete the information we hold about you, ${phone ? `call ${phone}` : "contact us"}${site.publicEmail ? ` or email ${site.publicEmail}` : ""}.</p>
  </div>
</section>`,
  });

  // ---------- 404 ----------
  pages.push({
    path: "/404.html",
    file: "404.html",
    title: "Page not found | ClearLot YQR",
    description: "This page doesn’t exist.",
    noindex: true,
    body: `<section class="section"><div class="wrap stack" style="max-width:640px">
  <h1>We couldn’t find that page</h1>
  <p class="lede">It may have moved. Try one of these instead.</p>
  <div class="hero-actions"><a class="btn btn-primary" href="/book/">Book snow removal</a><a class="btn btn-quiet" href="/">Go to the home page</a></div>
</div></section>`,
  });

  return pages;
}
