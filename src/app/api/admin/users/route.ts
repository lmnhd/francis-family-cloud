import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { listAllUsers, createUser } from "@/lib/repos/users";
import { writeAuditEvent } from "@/lib/repos/audit";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await listAllUsers();
  // Never expose password hashes to the client
  return NextResponse.json(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    users.map(({ passwordHash, ...u }) => u)
  );
}

const createSchema = z.object({
  displayName: z.string().min(1).max(60),
  password: z.string().min(8),
  role: z.enum(["member", "admin"]).default("member"),
  email: z.string().email().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );

  const user = await createUser({
    displayName: parsed.data.displayName,
    plainPassword: parsed.data.password,
    role: parsed.data.role,
    email: parsed.data.email,
  });

  await writeAuditEvent({
    targetUserId: user.id,
    actorUserId: session.user.id,
    eventType: "admin.user.create",
    metadata: { displayName: user.displayName, role: user.role },
  });

  return NextResponse.json({ id: user.id }, { status: 201 });
}
