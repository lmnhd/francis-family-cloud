import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import {
  getUserById,
  disableUser,
  enableUser,
  resetUserPassword,
} from "@/lib/repos/users";
import { writeAuditEvent } from "@/lib/repos/audit";

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("disable") }),
  z.object({ action: z.literal("enable") }),
  z.object({ action: z.literal("reset-password"), newPassword: z.string().min(8) }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id: targetUserId } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const target = await getUserById(targetUserId);
  if (!target)
    return NextResponse.json({ error: "User not found" }, { status: 404 });

  const adminId = session.user.id;

  switch (parsed.data.action) {
    case "disable":
      await disableUser(targetUserId, target.displayName);
      await writeAuditEvent({
        targetUserId,
        actorUserId: adminId,
        eventType: "admin.user.disable",
      });
      break;
    case "enable":
      await enableUser(targetUserId, target.displayName);
      await writeAuditEvent({
        targetUserId,
        actorUserId: adminId,
        eventType: "admin.user.enable",
      });
      break;
    case "reset-password":
      await resetUserPassword(targetUserId, parsed.data.newPassword);
      await writeAuditEvent({
        targetUserId,
        actorUserId: adminId,
        eventType: "admin.user.password_reset",
      });
      break;
  }

  return NextResponse.json({ ok: true });
}
