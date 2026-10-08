"use client";

/**
 * Showcase mode has been disposed.
 * All unauthenticated access redirects by default to the login page.
 */
export default function ShowcaseGuestCard() {
  return null;
}

/**
 * Helper to redirect to login if any unauthenticated action is triggered
 */
export function triggerGuestRestriction(_actionName = "Accessing workspace") {
  if (typeof window !== "undefined") {
    window.location.href = "/auth/login";
  }
}
