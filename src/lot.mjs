/**
 * The site plan: an architect-style drawing of a Regina lot in navy ink on paper.
 * Each surface the customer chooses is inked in high-visibility orange with its label,
 * so the drawing becomes the job sheet.
 *
 * Groups carry data-k (which choice) and data-v (which value). A group is "on" when the
 * state has that value. data-v="?" means "not chosen yet", and "!x" means "anything but x".
 * book.js applies the same rule in the browser.
 */

const INK = "#17253a";
const INK_SOFT = "#8a93a3";
const ORANGE = "#ef6a22";
const PAPER = "#fbfaf6";

export function isOn(state, k, v) {
  const cur = state[k];
  if (v === "?") return cur === undefined || cur === "" || cur === null;
  if (v.startsWith("!")) return String(cur) !== v.slice(1);
  return String(cur) === v;
}

const g = (state, k, v, inner) =>
  `<g data-k="${k}" data-v="${v}" class="var${isOn(state, k, v) ? " on" : ""}">${inner}</g>`;

const rect = (x, y, w, h, attrs = "") => `<rect x="${x}" y="${y}" width="${w}" height="${h}" ${attrs}/>`;
const line = (x1, y1, x2, y2, attrs = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${attrs}/>`;

/** A surface inked onto the plan: orange fill, ink edge, optional ice melt dots. */
const surface = (x, y, w, h, id) =>
  rect(x, y, w, h, `fill="${ORANGE}" stroke="${INK}" stroke-width="1.5"`) +
  rect(x, y, w, h, `fill="url(#${id}-ice)" class="ice"`);

/** A surface before it's chosen: a thin dashed outline. */
const ghost = (x, y, w, h) => rect(x, y, w, h, `fill="none" stroke="${INK_SOFT}" stroke-width="1.2" stroke-dasharray="5 4"`);

/** A small label with a paper background so it reads over hatching. */
function label(x, y, text, { anchor = "middle", size = 13, weight = 600, bg = PAPER, color = INK } = {}) {
  const w = text.length * size * 0.56 + 12;
  const bx = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x - 6;
  return (
    (bg ? rect(bx, y - size + 1, w, size + 7, `fill="${bg}" rx="3"`) : "") +
    `<text x="${x}" y="${y + 2}" text-anchor="${anchor}" font-size="${size}" font-weight="${weight}" fill="${color}">${text}</text>`
  );
}

/** A dimension line with end ticks and a caption, like on a drawing. */
function dimension(x1, x2, y, text) {
  const tick = (x) => line(x, y - 6, x, y + 6, `stroke="${INK}" stroke-width="1.2"`);
  return line(x1, y, x2, y, `stroke="${INK}" stroke-width="1.2"`) + tick(x1) + tick(x2) + label((x1 + x2) / 2, y + 4, text, { size: 12, weight: 500 });
}

function driveway(x, w, cars, id, pad = false) {
  const top = 250;
  const bottom = 404;
  let s = "";
  if (pad) s += surface(58, 170, 46, bottom - 170, id) + label(81, 214, "RV pad", { size: 11, bg: "" });
  s += surface(x, top, w, bottom - top, id);
  s += dimension(pad ? 58 : x, x + w, 286, cars);
  return s;
}

export function renderLot(state = {}, id = "lot", { title = "Site plan of a Regina home showing the driveway, sidewalk and walkway", crop = false } = {}) {
  const p = [];
  p.push(`<defs>
    <pattern id="${id}-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="8" stroke="${INK}" stroke-width="1" opacity=".28"/>
    </pattern>
    <pattern id="${id}-ice" width="8" height="8" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.1" fill="${INK}" opacity=".55"/><circle cx="6" cy="6" r="1.1" fill="${INK}" opacity=".35"/>
    </pattern>
  </defs>`);

  // Street, curb lines and centre line.
  p.push(rect(0, 404, 640, 76, `fill="#eceae3"`));
  p.push(line(0, 404, 640, 404, `stroke="${INK}" stroke-width="1.5"`));
  p.push(line(0, 446, 640, 446, `stroke="${INK_SOFT}" stroke-width="1.5" stroke-dasharray="18 12"`));
  p.push(label(24, 470, "Street", { anchor: "start", size: 12, weight: 500, bg: "", color: "#5d6878" }));

  // Neighbouring lots: property lines and hatched footprints.
  p.push(line(80, 24, 80, 380, `stroke="${INK_SOFT}" stroke-width="1" stroke-dasharray="2 5"`));
  p.push(rect(-40, 120, 92, 128, `fill="url(#${id}-hatch)" stroke="${INK_SOFT}" stroke-width="1"`));
  p.push(
    g(
      state,
      "sidewalk",
      "!corner",
      line(536, 24, 536, 380, `stroke="${INK_SOFT}" stroke-width="1" stroke-dasharray="2 5"`) +
        rect(570, 116, 110, 132, `fill="url(#${id}-hatch)" stroke="${INK_SOFT}" stroke-width="1"`),
    ),
  );

  // Sidewalk: before a choice, a faint outline of the public sidewalk.
  p.push(g(state, "sidewalk", "?", ghost(0, 382, 640, 18)));
  p.push(
    g(
      state,
      "sidewalk",
      "regular",
      rect(0, 382, 640, 18, `fill="none" stroke="${INK_SOFT}" stroke-width="1"`) + surface(80, 382, 456, 18, id) + label(470, 378, "Sidewalk", { size: 11 }),
    ),
  );
  p.push(
    g(
      state,
      "sidewalk",
      "corner",
      rect(572, 0, 68, 480, `fill="#eceae3"`) +
        line(572, 0, 572, 404, `stroke="${INK}" stroke-width="1.5"`) +
        line(610, 0, 610, 480, `stroke="${INK_SOFT}" stroke-width="1.5" stroke-dasharray="18 12"`) +
        rect(0, 382, 548, 18, `fill="none" stroke="${INK_SOFT}" stroke-width="1"`) +
        surface(80, 382, 468, 18, id) +
        surface(548, 24, 18, 376, id) +
        label(470, 378, "Corner sidewalk", { size: 11 }),
    ),
  );

  // Property line of this lot.
  p.push(rect(80, 24, 456, 352, `fill="none" stroke="${INK}" stroke-width="1.2" stroke-dasharray="10 4 2 4"`));

  // Driveway: before a choice, a dashed outline.
  p.push(g(state, "driveway", "?", ghost(110, 250, 110, 154) + label(165, 330, "Driveway", { size: 12, weight: 500, bg: "", color: "#5d6878" })));
  p.push(g(state, "driveway", "single", driveway(110, 60, "1 car wide", id)));
  p.push(g(state, "driveway", "double", driveway(110, 110, "2 cars wide", id)));
  p.push(g(state, "driveway", "triple", driveway(110, 160, "3 cars wide", id)));
  p.push(g(state, "driveway", "rv", driveway(110, 110, "2 cars + RV pad", id, true)));

  // Walkways.
  p.push(g(state, "walkway", "?", ghost(322, 262, 16, 120)));
  p.push(g(state, "walkway", "regular", surface(322, 262, 16, 120, id)));
  p.push(g(state, "walkway", "long", surface(322, 262, 16, 120, id) + surface(450, 60, 16, 322, id) + label(458, 52, "Back gate", { size: 11 })));

  // House and garage footprint.
  p.push(rect(110, 150, 120, 100, `fill="url(#${id}-hatch)" stroke="${INK}" stroke-width="2"`));
  p.push(rect(230, 110, 210, 140, `fill="url(#${id}-hatch)" stroke="${INK}" stroke-width="2"`));
  p.push(label(335, 184, "House"));
  p.push(label(170, 204, "Garage"));
  // Front door.
  p.push(rect(318, 246, 24, 8, `fill="${PAPER}" stroke="${INK}" stroke-width="1.5"`));

  // Front steps.
  p.push(g(state, "steps", "true", surface(312, 254, 36, 10, id) + line(312, 259, 348, 259, `stroke="${INK}" stroke-width="1"`)));

  // North arrow.
  p.push(`<g transform="translate(40 64)"><circle r="16" fill="none" stroke="${INK}" stroke-width="1.2"/><path d="M0 -12 6 8 0 3 -6 8Z" fill="${INK}"/></g>`);
  p.push(label(40, 98, "N", { size: 12, bg: "" }));

  return `<svg class="lot" viewBox="0 0 640 480" role="img" aria-label="${title}" data-ice="${state.iceMelt ? "1" : "0"}"${crop ? ' preserveAspectRatio="xMidYMax slice"' : ""} font-family="Public Sans, system-ui, sans-serif" xmlns="http://www.w3.org/2000/svg">${p.join("")}</svg>`;
}
