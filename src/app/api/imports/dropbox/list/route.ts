import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFreshDropboxAccessToken, listDropboxFolder } from "@/lib/providers/dropbox";
import { getProviderConnection } from "@/lib/repos/provider-connections";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const connection = await getProviderConnection(session.user.id, "dropbox");
  if (!connection)
    return NextResponse.json({ error: "Dropbox is not connected" }, { status: 409 });

  const path = request.nextUrl.searchParams.get("path") ?? "";

  try {
    const accessToken = await getFreshDropboxAccessToken(connection);
    const result = await listDropboxFolder(accessToken, path);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not list Dropbox folder" }, { status: 502 });
  }
}
