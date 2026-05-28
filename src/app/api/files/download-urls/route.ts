import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { getFileById } from "@/lib/repos/files";
import { createPresignedDownloadUrl } from "@/lib/aws/presign";

const schema = z.object({ ids: z.array(z.string().min(1)).min(1).max(50) });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const results = await Promise.allSettled(
    parsed.data.ids.map(async (id) => {
      const file = await getFileById(userId, id);
      if (!file || file.status !== "available") return null;
      const url = await createPresignedDownloadUrl(file.s3Key, file.displayName);
      return { id, fileName: file.displayName, url };
    })
  );

  const files = results
    .filter(
      (r): r is PromiseFulfilledResult<{ id: string; fileName: string; url: string }> =>
        r.status === "fulfilled" && r.value !== null
    )
    .map((r) => r.value);

  return NextResponse.json({ files });
}
