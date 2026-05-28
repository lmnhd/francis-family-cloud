// Public (to any authenticated family member) list of active roster members.
// Returns only id + displayName — no passwords or sensitive fields.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listActiveRoster } from "@/lib/repos/roster";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const roster = await listActiveRoster();
  // Filter out the current user — no point sharing with yourself
  const others = roster.filter((u) => u.userId !== session.user.id);
  return NextResponse.json({ users: others });
}
