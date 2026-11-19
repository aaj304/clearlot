/**
 * The overhead drawing of a Regina lot in snow. Each surface is drawn cleared, and shown or
 * hidden by state, so picking "corner lot" or "triple driveway" clears that part of the picture.
 *
 * Groups carry data-k (which choice) and data-v (which value). A group is "on" when the state
 * has that value. data-v="?" means "not chosen yet", and "!x" means "anything except x".
 * book.js applies the same rule in the browser.
 */

const ASPHALT = "#4f5a66";
const CONCRETE = "#c3cad2";
const SNOW = "#fbfcfe";
const BANK = "#ffffff";
const BANK_SHADOW = "#c5d1dd";
const HINT = "#e9eff5";

export function isOn(state, k, v) {
  const cur = state[k];
  if (v === "?") return cur === undefined || cur === "" || cur === null;
  if (v.startsWith("!")) return String(cur) !== v.slice(1);
  return String(cur) === v;
}

function g(state, k, v, inner, extra = "") {
  return `<g data-k="${k}" data-v="${v}" class="var${isOn(state, k, v) ? " on" : ""}"${extra}>${inner}</g>`;
}

const rect = (x, y, w, h, fill, rx = 0, extra = "") =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;

/** Plowed snow piled along an edge: a soft white ridge with a blue shadow on its south side. */
function bank(x, y, w, h) {
  return rect(x + 1, y + 3, w, h, BANK_SHADOW, Math.min(w, h) / 2) + rect(x, y, w, h, BANK, Math.min(w, h) / 2);
}

function ice(x, y, w, h, id) {
  return rect(x, y, w, h, `url(#${id}-ice)`, 0, ' class="ice"');
}

function driveway(x, w, id, pad = false) {
  const top = 204;
  const bottom = 350; // runs through the sidewalk and the plow ridge to the street
  let s = "";
  if (pad) s += rect(18, 140, 40, bottom - 140, ASPHALT) + ice(18, 140, 40, bottom - 140, id);
  s += rect(x, top, w, bottom - top, ASPHALT) + ice(x, top, w, bottom - top, id);
  // Faint tire marks on the bare pavement, one pair per car width.
  const lanes = Math.max(1, Math.round(w / 48));
  for (let i = 0; i < lanes; i++) {
    const cx = x + (w / lanes) * (i + 0.5);
    s += rect(cx - 12, top + 8, 4, 100, "#58636e", 2) + rect(cx + 8, top + 8, 4, 100, "#58636e", 2);
  }
  // Snow piled along both edges, stopping short of the sidewalk.
  s += pad ? bank(8, 142, 9, 168) : bank(x - 10, top + 2, 9, 106);
  s += bank(x + w + 1, top + 2, 9, 106);
  return s;
}

/** A spruce seen from above, with snow resting on its branches. */
function spruce(cx, cy, r) {
  const star = (rad, inner) => {
    const pts = [];
    for (let i = 0; i < 20; i++) {
      const a = (Math.PI * 2 * i) / 20;
      const d = i % 2 ? rad * inner : rad;
      pts.push(`${(cx + Math.cos(a) * d).toFixed(1)},${(cy + Math.sin(a) * d).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  return (
    `<ellipse cx="${cx - 4}" cy="${cy - 10}" rx="${r}" ry="${r * 0.8}" fill="#dfe7ef"/>` +
    `<polygon points="${star(r, 0.72)}" fill="#2f4a3c"/>` +
    `<polygon points="${star(r * 0.68, 0.7)}" fill="#3d5d4b"/>` +
    `<circle cx="${cx + r * 0.25}" cy="${cy + r * 0.3}" r="${r * 0.22}" fill="#f4f8fb"/>` +
    `<circle cx="${cx - r * 0.35}" cy="${cy + r * 0.1}" r="${r * 0.16}" fill="#f4f8fb"/>` +
    `<circle cx="${cx + r * 0.05}" cy="${cy - r * 0.35}" r="${r * 0.14}" fill="#f4f8fb"/>`
  );
}

export function renderLot(state = {}, id = "lot", { title = "Overhead drawing of a house in Regina with its driveway, sidewalk and walkway", crop = false } = {}) {
  const parts = [];
  parts.push(`<defs>
    <pattern id="${id}-ice" width="9" height="9" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="0.9" fill="#8aa1b8" opacity=".6"/><circle cx="6" cy="6.5" r="0.7" fill="#b9c9d8" opacity=".7"/>
    </pattern>
  </defs>`);

  // Ground: fresh snow with soft drifts.
  parts.push(rect(0, 0, 480, 400, SNOW));
  parts.push(`<ellipse cx="120" cy="290" rx="60" ry="10" fill="${HINT}" opacity=".7"/>`);

  // Front street with packed snow tracks.
  parts.push(rect(0, 348, 480, 52, "#5b6672"));
  parts.push(rect(0, 360, 480, 6, "#7f8a96", 3) + rect(0, 382, 480, 6, "#7f8a96", 3));
  // The ridge the city plow leaves along the curb.
  parts.push(bank(-4, 340, 488, 10));

  // Neighbours, roofs only, cut off at the edges.
  parts.push(rect(-80, 70, 72, 132, "#e6ecf2", 6) + rect(-80, 70, 72, 66, "#f5f8fb", 6));
  parts.push(g(state, "sidewalk", "!corner", rect(452, 76, 90, 126, "#e6ecf2", 6) + rect(452, 76, 90, 63, "#f5f8fb", 6)));

  // Shadows the house casts north in low winter sun.
  parts.push(rect(46, 86, 156, 92, "#e1e8f0", 4) + rect(202, 38, 172, 140, "#e1e8f0", 4));

  // Corner lot: side street and the side sidewalk appear.
  parts.push(
    g(
      state,
      "sidewalk",
      "corner",
      rect(428, 0, 52, 400, "#5b6672") +
        rect(440, 0, 6, 348, "#7f8a96", 3) +
        rect(462, 0, 6, 348, "#7f8a96", 3) +
        bank(420, -6, 10, 346) +
        rect(404, 24, 16, 322, CONCRETE) +
        ice(404, 24, 16, 322, id) +
        rect(12, 318, 408, 16, CONCRETE) +
        ice(12, 318, 408, 16, id),
    ),
  );

  // Sidewalk, before a choice: a faint strip under the snow.
  parts.push(g(state, "sidewalk", "?", rect(0, 318, 480, 16, HINT)));
  parts.push(g(state, "sidewalk", "regular", rect(0, 318, 480, 16, HINT) + rect(12, 318, 396, 16, CONCRETE) + ice(12, 318, 396, 16, id)));

  // Driveway, before a choice: tire tracks pressed into snow.
  parts.push(g(state, "driveway", "?", rect(60, 204, 100, 136, HINT, 2) + rect(80, 210, 6, 124, "#dde5ee", 3) + rect(130, 210, 6, 124, "#dde5ee", 3)));
  parts.push(g(state, "driveway", "single", driveway(60, 52, id)));
  parts.push(g(state, "driveway", "double", driveway(60, 100, id)));
  parts.push(g(state, "driveway", "triple", driveway(60, 148, id)));
  parts.push(g(state, "driveway", "rv", driveway(60, 100, id, true)));

  // Walkways.
  parts.push(g(state, "walkway", "?", rect(292, 214, 16, 104, HINT)));
  parts.push(g(state, "walkway", "regular", rect(292, 214, 16, 104, CONCRETE) + ice(292, 214, 16, 104, id) + bank(309, 222, 6, 88)));
  parts.push(
    g(
      state,
      "walkway",
      "long",
      rect(292, 214, 16, 104, CONCRETE) +
        ice(292, 214, 16, 104, id) +
        rect(390, 80, 12, 238, CONCRETE) +
        ice(390, 80, 12, 238, id) +
        rect(386, 74, 22, 4, "#9aa6b2"),
    ),
  );

  // House and attached garage. Roofs under snow: south faces catch the low sun, north faces sit in shade.
  parts.push(`<g stroke="#a9b6c3" stroke-width="1.5" stroke-linejoin="round">
    <rect x="60" y="112" width="156" height="46" fill="#dde5ee"/>
    <rect x="60" y="158" width="156" height="46" fill="#fdfeff"/>
    <polygon points="216,64 388,64 342,128 262,128" fill="#d9e2ec"/>
    <polygon points="216,64 262,128 262,140 216,204" fill="#e9eff5"/>
    <polygon points="388,64 342,128 342,140 388,204" fill="#e9eff5"/>
    <polygon points="216,204 262,140 342,140 388,204" fill="#fdfeff"/>
    <rect x="262" y="128" width="80" height="12" fill="#f3f6fa"/>
  </g>`);
  parts.push(rect(352, 80, 14, 18, "#7c6e63", 2) + rect(350, 78, 18, 6, "#ffffff", 3));
  parts.push(spruce(150, 44, 22) + spruce(250, 270, 20) + spruce(24, 300, 16));

  // Front steps.
  parts.push(g(state, "steps", "?", ""));
  parts.push(
    g(
      state,
      "steps",
      "true",
      rect(284, 204, 32, 12, CONCRETE) + `<path d="M284 210h32" stroke="#a9b3bd" stroke-width="1.5"/>` + ice(284, 204, 32, 12, id),
    ),
  );

  return `<svg class="lot" viewBox="0 0 480 400" role="img" aria-label="${title}" data-ice="${state.iceMelt ? "1" : "0"}"${crop ? ' preserveAspectRatio="xMidYMax slice"' : ""} xmlns="http://www.w3.org/2000/svg">${parts.join("")}</svg>`;
}
