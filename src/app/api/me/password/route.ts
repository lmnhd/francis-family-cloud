import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getUserById, verifyPassword, resetUserPassword } from "@/lib/repos/users";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
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

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid)
    return NextResponse.json(
      { error: "Current password is incorrect" },
      { status: 400 }
    );

  await resetUserPassword(userId, parsed.data.newPassword);

  return NextResponse.json({ ok: true });
}
