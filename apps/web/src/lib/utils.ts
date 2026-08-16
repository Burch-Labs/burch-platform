export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Join a venue's street address to its city without repeating it.
 *
 * Most addresses partners give us already end in the city ("Woodvale Grove,
 * Westlands, Nairobi"), so blindly appending produced "…, Nairobi, Nairobi".
 * Appends only when the city is genuinely absent, matched case-insensitively
 * on a word boundary so "Nairobi" does not swallow a road named after it.
 */
export function formatVenueAddress(location: string, city?: string | null): string {
  if (!city) return location;
  const alreadyNamed = new RegExp(`\\b${city.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  return alreadyNamed.test(location) ? location : `${location}, ${city}`;
}
