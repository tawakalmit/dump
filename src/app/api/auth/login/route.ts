import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    const restrictedUsername = process.env.ADMIN_9B_USERNAME;
    const restrictedPassword = process.env.ADMIN_9B_PASSWORD;
    const restrictedCategory = process.env.ADMIN_9B_CATEGORY || "9b";

    // Determine which account matched and its category scope.
    // An empty scope ("") means full access to all categories.
    let scope: string | null = null;

    if (
      adminUsername &&
      username === adminUsername &&
      password === adminPassword
    ) {
      scope = ""; // full admin
    } else if (
      restrictedUsername &&
      username === restrictedUsername &&
      password === restrictedPassword
    ) {
      scope = restrictedCategory; // restricted to a single category
    }

    if (scope !== null) {
      const response = NextResponse.json({ success: true, scope });
      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24, // 24 hours
      };
      response.cookies.set("admin_session", "authenticated", cookieOptions);
      // Store the category scope; readable so the UI can adapt.
      response.cookies.set("admin_category", scope, {
        ...cookieOptions,
        httpOnly: false,
      });
      return response;
    }

    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
