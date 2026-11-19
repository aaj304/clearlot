/**
 * Everything a customer can choose, with the words shown on the site and in booking emails.
 * Prices live in prices.json at the project root.
 */
export const CATALOG = {
  plan: {
    once: {
      label: "One-time clearing",
      short: "One time",
      desc: "We come once, within 24 hours of your booking",
    },
    winter: {
      label: "Whole winter",
      short: "Whole winter",
      desc: "Every snowfall of {cm} cm or more, {season}. Cleared within 24 hours after the snow stops",
    },
  },
  driveway: {
    single: { label: "Single driveway", desc: "One car wide. Fits one car, or two parked one behind the other" },
    double: { label: "Double driveway", desc: "Two cars wide, side by side" },
    triple: { label: "Triple driveway", desc: "Three cars wide, side by side" },
    rv: { label: "Extra-long or RV pad", desc: "A double driveway plus a pad beside it for an RV, trailer or boat" },
  },
  sidewalk: {
    none: { label: "No sidewalk", desc: "There is no city sidewalk beside my home" },
    regular: { label: "Regular sidewalk", desc: "The sidewalk across the front of my home" },
    corner: { label: "Corner lot sidewalk", desc: "Sidewalk along the front and the side of my home" },
  },
  walkway: {
    none: { label: "No walkway", desc: "Just the driveway and sidewalk" },
    regular: { label: "Front walkway", desc: "The path to my front door" },
    long: { label: "Front and side walkway", desc: "The path to my front door, plus a side path to the back gate" },
  },
  extras: {
    steps: { label: "Front steps and landing", desc: "Cleared by hand" },
    iceMelt: { label: "Ice melt", desc: "Spread on the driveway and paths after clearing" },
  },
};

export function priceFor(prices, plan, choice) {
  const p = prices[plan];
  let total = p.driveway[choice.driveway] ?? 0;
  total += p.sidewalk[choice.sidewalk] ?? 0;
  total += p.walkway[choice.walkway] ?? 0;
  if (choice.steps) total += p.steps;
  if (choice.iceMelt) total += p.iceMelt;
  return total;
}
