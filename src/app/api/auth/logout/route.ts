import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const expire = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  };
  response.cookies.set("admin_session", "", expire);
  response.cookies.set("admin_category", "", { ...expire, httpOnly: false });
  return response;
}
