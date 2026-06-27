/**
 * Reads the current admin's category scope from the (non-httpOnly)
 * `admin_category` cookie on the client.
 *
 * Returns `null` for full admins (no restriction) or a category slug
 * (e.g. "9b") for restricted admins.
 */
export function getAdminScopeClient(): string | null {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith("admin_category="));

  if (!match) return null;

  const value = decodeURIComponent(match.split("=")[1] ?? "");
  return value ? value : null;
}
