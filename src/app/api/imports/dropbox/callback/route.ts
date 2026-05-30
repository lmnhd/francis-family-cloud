import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { exchangeDropboxCode } from "@/lib/providers/dropbox";
import { upsertProviderConnection } from "@/lib/repos/provider-connections";

const STATE_COOKIE = "dropbox_oauth_state";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL("/", request.url));

  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(STATE_COOKIE)?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL("/box/imports?dropbox=state_error", request.url));
  }

  try {
    const token = await exchangeDropboxCode(code);
    await upsertProviderConnection({
      ownerUserId: session.user.id,
      provider: "dropbox",
      accountId: token.account_id,
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresInSeconds: token.expires_in,
      scope: token.scope,
    });
  } catch {
    return NextResponse.redirect(new URL("/box/imports?dropbox=connect_error", request.url));
  }

  cookieStore.delete(STATE_COOKIE);
  return NextResponse.redirect(new URL("/box/imports?dropbox=connected", request.url));
}
