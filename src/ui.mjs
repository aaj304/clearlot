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

/** The signature: a ticket that turns the 24-hour promise into a real time. */
export function ticket({ booked = "Book now", cleared = "Within 24 hours", live = false, caption = "" } = {}) {
  return `<div class="ticket"${live ? " data-live-ticket" : ""}>
  <div class="ticket-row"><span class="ticket-label">Booked</span><span class="ticket-value" data-booked>${booked}</span></div>
  <div class="ticket-tear" aria-hidden="true"></div>
  <div class="ticket-row"><span class="ticket-label">Cleared by</span><span class="ticket-value ticket-strong" data-cleared>${cleared}</span></div>
  ${caption ? `<p class="ticket-caption">${caption}</p>` : ""}
</div>`;
}

/** Little top-down diagrams for the option cards, drawn in the same style as the lot. */
const car = (x, y, color = "#5d6976") =>
  `<rect x="${x}" y="${y}" width="13" height="24" rx="4" fill="${color}"/><rect x="${x + 2}" y="${y + 5}" width="9" height="6" rx="1.5" fill="#c9d4df"/>`;

export const DIAGRAM = {
  single: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="22" y="4" width="20" height="40" rx="3" fill="#dbe3eb"/>${car(25.5, 12)}</svg>`,
  double: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="12" y="4" width="40" height="40" rx="3" fill="#dbe3eb"/>${car(16, 12)}${car(35, 12, "#8796a5")}</svg>`,
  triple: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="2" y="4" width="60" height="40" rx="3" fill="#dbe3eb"/>${car(6, 12)}${car(25.5, 12, "#8796a5")}${car(45, 12)}</svg>`,
  rv: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="2" y="4" width="60" height="40" rx="3" fill="#dbe3eb"/><rect x="6" y="6" width="15" height="36" rx="3" fill="#8796a5"/><rect x="8" y="10" width="11" height="6" rx="1.5" fill="#c9d4df"/>${car(27, 12)}${car(45, 12, "#8796a5")}</svg>`,
  sidewalkNone: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="6" width="36" height="24" rx="2" fill="#dbe3eb"/></svg>`,
  sidewalkRegular: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="6" width="36" height="24" rx="2" fill="#dbe3eb"/><rect x="4" y="36" width="56" height="7" rx="2" fill="#5d6976"/></svg>`,
  sidewalkCorner: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="6" width="36" height="24" rx="2" fill="#dbe3eb"/><rect x="2" y="36" width="58" height="7" rx="2" fill="#5d6976"/><rect x="53" y="2" width="7" height="41" rx="2" fill="#5d6976"/></svg>`,
  walkwayNone: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="4" width="36" height="24" rx="2" fill="#dbe3eb"/></svg>`,
  walkwayRegular: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="4" width="36" height="24" rx="2" fill="#dbe3eb"/><rect x="29" y="28" width="6" height="18" rx="1.5" fill="#5d6976"/></svg>`,
  walkwayLong: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="4" width="36" height="24" rx="2" fill="#dbe3eb"/><rect x="25" y="28" width="6" height="18" rx="1.5" fill="#5d6976"/><rect x="50" y="4" width="6" height="42" rx="1.5" fill="#5d6976"/></svg>`,
  steps: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="14" y="4" width="36" height="20" rx="2" fill="#dbe3eb"/><rect x="20" y="26" width="24" height="6" rx="1.5" fill="#5d6976"/><rect x="20" y="34" width="24" height="6" rx="1.5" fill="#8796a5"/></svg>`,
  iceMelt: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="8" y="8" width="48" height="32" rx="3" fill="#5d6976"/>${[[16,16],[28,22],[40,14],[48,28],[20,32],[34,34],[44,22],[24,24]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8" fill="#dbe3eb"/>`).join("")}</svg>`,
  once: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="8" width="44" height="34" rx="4" fill="#dbe3eb"/><rect x="10" y="8" width="44" height="9" rx="4" fill="#5d6976"/><circle cx="32" cy="30" r="6" fill="#5d6976"/></svg>`,
  winter: `<svg viewBox="0 0 64 48" aria-hidden="true"><rect x="10" y="8" width="44" height="34" rx="4" fill="#dbe3eb"/><rect x="10" y="8" width="44" height="9" rx="4" fill="#5d6976"/>${[0,1,2,3,4].map(i=>`<circle cx="${17 + i * 7.5}" cy="27" r="2.6" fill="#5d6976"/>`).join("")}${[0,1,2,3,4].map(i=>`<circle cx="${17 + i * 7.5}" cy="35" r="2.6" fill="#8796a5"/>`).join("")}</svg>`,
};

export const money = (n) => `$${n.toLocaleString("en-CA")}`;
