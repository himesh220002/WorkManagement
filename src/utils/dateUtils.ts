/**
 * Deterministic date formatting utilities safe for Next.js SSR & React Hydration.
 * Prevents hydration mismatches between Node.js server locales and browser locales.
 */

export function formatDate(
  dateInput: string | Date | number | null | undefined,
  fallback = "No deadline"
): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return fallback;
  }
}

export function formatNumericDate(
  dateInput: string | Date | number | null | undefined,
  fallback = "-"
): string {
  if (!dateInput) return fallback;
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return fallback;
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: "UTC",
    });
  } catch {
    return fallback;
  }
}
