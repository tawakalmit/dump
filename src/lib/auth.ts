import { NextRequest, NextResponse } from "next/server";

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
