// List files inside a shared folder (read-only access for non-owners).
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listFilesInFolder } from "@/lib/repos/files";
import { getFolderById } from "@/lib/repos/folders";
import { getFamilyShare, getUserShare } from "@/lib/repos/family-shares";
import { shouldGeneratePreview } from "@/lib/previews";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const ownerUserId = searchParams.get("owner");
  const folderId = searchParams.get("folderId");
  if (!ownerUserId || !folderId)
    return NextResponse.json({ error: "owner and folderId required" }, { status: 400 });

  const myId = session.user.id;

  // Folder owners can always access their own content (handled elsewhere).
  // This endpoint is for cross-user access.
  const [familyShare, userShare] = await Promise.all([
    getFamilyShare("folder", folderId),
    getUserShare(myId, "folder", folderId),
  ]);

  if (!familyShare && !userShare)
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  const [folder, files] = await Promise.all([
    getFolderById(ownerUserId, folderId),
    listFilesInFolder(ownerUserId, folderId),
  ]);

  if (!folder) return NextResponse.json({ error: "Folder not found" }, { status: 404 });

  const withPreviews = await Promise.all(
    files.map(async (f) => ({
      ...f,
      previewUrl: shouldGeneratePreview(f.mimeType, f.displayName)
        ? `/api/sharing/thumbnail?owner=${ownerUserId}&fileId=${f.id}`
        : null,
    }))
  );

  return NextResponse.json({ folder, files: withPreviews, ownerUserId });
}
