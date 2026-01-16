import { NextResponse } from "next/server";
import { clearSession, getSessionCookieName, getSessionToken } from "@/lib/auth";

export async function POST() {
  const token = await getSessionToken();

  if (token) {
    await clearSession(token);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getSessionCookieName(), "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: new Date(0),
    path: "/",
  });

  return response;
}
