import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteProviderConnection } from "@/lib/repos/provider-connections";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await deleteProviderConnection(session.user.id, "dropbox");
  return NextResponse.json({ ok: true });
}
