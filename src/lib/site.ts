/** Public-facing business details. Safe to import from client components. */
export const SITE = {
  name: "ClearLot",
  tagline: "Snow removal for Regina homes",
  city: "Regina",
  phone: process.env.NEXT_PUBLIC_BUSINESS_PHONE || "",
  email: process.env.NEXT_PUBLIC_BUSINESS_EMAIL || "",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
};

/**
 * Service promises shown on the site. Only publish numbers your crews will actually meet:
 * confirm these with your subcontractors before launch.
 */
export const SERVICE = {
  /** Snowfall that triggers a visit. */
  triggerCm: 3,
  /** Hours after the snow stops by which the property is cleared. */
  clearWithinHours: 24,
  seasonLabel: "November 1 to March 31",
};
