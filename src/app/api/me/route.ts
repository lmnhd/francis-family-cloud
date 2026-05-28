import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getUserById, updateDisplayName } from "@/lib/repos/users";

const schema = z.object({
  displayName: z
    .string()
    .min(1, "Name cannot be empty")
    .max(60, "Name is too long"),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const user = await getUserById(userId);
  if (!user)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const newName = parsed.data.displayName.trim();
  if (newName === user.displayName)
    return NextResponse.json({ ok: true });

  await updateDisplayName(userId, user.displayName, newName);

  return NextResponse.json({ ok: true, displayName: newName });
}
