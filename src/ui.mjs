/** Small shared pieces of markup: icons, buttons, the ticket, and option diagrams. */

const ic = (paths, size = 22) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICON = {
  phone: ic('<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'),
  check: ic('<path d="M20 6 9 17l-5-5"/>'),
  clock: ic('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>'),
  left: ic('<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>'),
  right: ic('<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>'),
  menu: ic('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  close: ic('<path d="M18 6 6 18M6 6l12 12"/>'),
  pin: ic('<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>'),
  mail: ic('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
};

export const tel = (phone) => `tel:${phone.replace(/[^\d+]/g, "")}`;

/**
 * The signature: a numbered work order. It turns the 24-hour promise into a real time
 * and shows the job line by line, like the carbon copy a crew carries.
 */
export function workOrder({ ref = "Example", lines = [], total = "", unit = "", monthly = "", booked = "Now", cleared = "Within 24 hours", live = false } = {}) {
  const rows = lines.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join("");
  return `<div class="wo"${live ? " data-live-ticket" : ""}>
  <div class="wo-head"><span>Work order</span><span class="wo-ref" data-ref>No. ${ref}</span></div>
  <dl class="wo-lines" data-lines>${rows}</dl>
  <div class="wo-total"${total ? "" : " hidden"} data-total-row><span><span data-total-unit>${unit}</span><span class="wo-monthly" data-monthly>${monthly}</span></span><strong data-total>${total}</strong></div>
  <div class="wo-times">
    <div><span>Booked</span><strong data-booked>${booked}</strong></div>
    <div><span>Cleared by</span><strong data-cleared class="wo-due">${cleared}</strong></div>
  </div>
</div>`;
}

/** Small plan-style diagrams for the option cards: ink outlines, the chosen surface in orange. */
const O = "#ef6a22";
const I = "#0d192b";
const house = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${I}" stroke-width="1.5"/>`;
const fill = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${O}" stroke="${I}" stroke-width="1.2"/>`;
const car = (x, y) => `<rect x="${x}" y="${y}" width="10" height="17" rx="3" fill="#fbfaf6" stroke="${I}" stroke-width="1.2"/>`;
const svg = (inner) => `<svg viewBox="0 0 64 48" aria-hidden="true">${inner}</svg>`;
const dots = [[16, 16], [28, 22], [40, 14], [48, 28], [20, 32], [34, 32], [44, 22], [24, 24]]
  .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.7" fill="${I}"/>`)
  .join("");
const sheet = `<rect x="10" y="8" width="44" height="34" rx="3" fill="none" stroke="${I}" stroke-width="1.5"/><line x1="10" y1="17" x2="54" y2="17" stroke="${I}" stroke-width="1.5"/>`;
const months = [0, 1, 2, 3, 4]
  .map((i) => `<rect x="${14 + i * 8}" y="22" width="5" height="5" fill="${O}"/><rect x="${14 + i * 8}" y="31" width="5" height="5" fill="${O}"/>`)
  .join("");

export const DIAGRAM = {
  single: svg(fill(25, 6, 14, 38) + car(27, 16)),
  double: svg(fill(16, 6, 32, 38) + car(19, 16) + car(35, 16)),
  triple: svg(fill(6, 6, 52, 38) + car(9, 16) + car(27, 16) + car(45, 16)),
  rv: svg(fill(4, 6, 14, 38) + fill(20, 6, 34, 38) + `<rect x="6" y="9" width="10" height="28" rx="2" fill="#fbfaf6" stroke="${I}" stroke-width="1.2"/>` + car(23, 16) + car(40, 16)),
  sidewalkNone: svg(house(16, 6, 32, 24) + `<line x1="4" y1="40" x2="60" y2="40" stroke="#69748a" stroke-dasharray="3 3"/>`),
  sidewalkRegular: svg(house(16, 6, 32, 24) + fill(4, 36, 56, 7)),
  sidewalkCorner: svg(house(10, 6, 32, 24) + fill(2, 36, 54, 7) + fill(53, 2, 7, 41)),
  walkwayNone: svg(house(14, 4, 36, 24)),
  walkwayRegular: svg(house(14, 4, 36, 24) + fill(29, 28, 6, 18)),
  walkwayLong: svg(house(8, 4, 36, 24) + fill(23, 28, 6, 18) + fill(50, 4, 6, 42)),
  steps: svg(house(14, 4, 36, 22) + fill(22, 26, 20, 6) + fill(22, 34, 20, 6)),
  iceMelt: svg(fill(8, 8, 48, 32) + dots),
  once: svg(sheet + fill(27, 23, 10, 12)),
  winter: svg(sheet + months),
};

export const money = (n) => `$${n.toLocaleString("en-CA")}`;
/** Whole-winter prices can be paid in this many monthly payments, November to March. */
export const monthlyOf = (winter, months) => Math.round(winter / months);
