import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createDropboxAuthorizationUrl } from "@/lib/providers/dropbox";

const STATE_COOKIE = "dropbox_oauth_state";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const state = randomBytes(24).toString("base64url");
  const url = createDropboxAuthorizationUrl(state);
  const cookieStore = await cookies();
  cookieStore.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 10 * 60,
    path: "/",
  });

  return NextResponse.redirect(url);
}
