import { NextRequest, NextResponse } from "next/server";
import slugify from "@/lib/slugify";

/**
 * Check if the request has a valid admin session cookie.
 * Returns null if authenticated, or a 401 NextResponse if not.
 */
export function requireAuth(request: NextRequest): NextResponse | null {
  const session = request.cookies.get("admin_session");

  if (!session || session.value !== "authenticated") {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return null;
}

/**
 * Returns the category scope of the current admin.
 * - `null` means full access (no restriction).
 * - A string (e.g. "9b") means the admin may only access that category.
 */
export function getAdminScope(request: NextRequest): string | null {
  const cookie = request.cookies.get("admin_category");
  const value = cookie?.value;
  return value ? value : null;
}

/**
 * Whether the current admin is allowed to access an album with the given
 * category name. Full admins (no scope) can access everything.
 */
export function isCategoryAllowed(
  request: NextRequest,
  categoryName: string | null | undefined
): boolean {
  const scope = getAdminScope(request);
  if (!scope) return true;
  const slug = categoryName ? slugify(categoryName) : "uncategorized";
  return slug === scope;
}

/**
 * Returns a 403 response if the admin is not allowed to access the category,
 * otherwise null.
 */
export function requireCategoryAccess(
  request: NextRequest,
  categoryName: string | null | undefined
): NextResponse | null {
  if (!isCategoryAllowed(request, categoryName)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
