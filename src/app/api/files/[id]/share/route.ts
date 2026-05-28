import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById } from "@/lib/repos/files";
import {
  createShareLink,
  getShareLink,
  revokeShareLink,
} from "@/lib/repos/shares";
import { writeAuditEvent } from "@/lib/repos/audit";

const createSchema = z.object({ expiresInDays: z.number().int().min(1).max(365).optional() });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;

  const file = await getFileById(userId, fileId);
  if (!file || file.status !== "available")
    return NextResponse.json({ error: "File not found" }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);

  const link = await createShareLink({
    fileId,
    ownerUserId: userId,
    expiresInDays: parsed.success ? parsed.data.expiresInDays : undefined,
  });

  await writeAuditEvent({
    targetUserId: userId,
    eventType: "share.create",
    entityType: "file",
    entityId: fileId,
    metadata: { shareToken: link.shareToken },
  });

  return NextResponse.json({ shareToken: link.shareToken });
}

// DELETE /api/files/[id]/share?token=<token>
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const { id: fileId } = await params;
  const token = new URL(request.url).searchParams.get("token");
  if (!token)
    return NextResponse.json({ error: "token required" }, { status: 400 });

  const link = await getShareLink(token);
  if (!link || link.ownerUserId !== userId || link.fileId !== fileId)
    return NextResponse.json({ error: "Share link not found" }, { status: 404 });

  await revokeShareLink(token);
  await writeAuditEvent({
    targetUserId: userId,
    eventType: "share.revoke",
    entityType: "file",
    entityId: fileId,
    metadata: { shareToken: token },
  });

  return NextResponse.json({ ok: true });
}
