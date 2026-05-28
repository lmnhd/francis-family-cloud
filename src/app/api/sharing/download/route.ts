// Download a file the current user doesn't own but has access to via sharing.
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getFileById } from "@/lib/repos/files";
import { getFamilyShare, getUserShare } from "@/lib/repos/family-shares";
import { createPresignedDownloadUrl } from "@/lib/aws/presign";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ownerUserId = searchParams.get("owner");
  const fileId = searchParams.get("fileId");
  if (!ownerUserId || !fileId)
    return NextResponse.json({ error: "owner and fileId required" }, { status: 400 });

  const myId = session.user.id;

  // Verify this file is actually shared with the requesting user
  const [familyShare, userShare] = await Promise.all([
    getFamilyShare("file", fileId),
    getUserShare(myId, "file", fileId),
  ]);

  const share = familyShare ?? userShare;
  if (!share || share.ownerUserId !== ownerUserId)
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  // Fetch the live file record from the owner's data
  const file = await getFileById(ownerUserId, fileId);
  if (!file || file.status !== "available")
    return NextResponse.json({ error: "File not available" }, { status: 404 });

  const url = await createPresignedDownloadUrl(file.s3Key, file.displayName);
  return NextResponse.redirect(url);
}
