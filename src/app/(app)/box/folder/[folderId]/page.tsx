import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { getFolderById, getFolderPath } from "@/lib/repos/folders";
import { getUserStorageBytes } from "@/lib/repos/files";
import { FolderContents } from "../../_folder-contents";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ folderId: string }>;
}

export default async function SubFolderPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { folderId } = await params;
  const userId = session.user.id;

  const [folder, storageBytes] = await Promise.all([
    getFolderById(userId, folderId),
    getUserStorageBytes(userId),
  ]);

  if (!folder || folder.deletedAt) notFound();

  // Build breadcrumb path (ancestors between root and this folder, exclusive).
  const breadcrumbPath = await getFolderPath(userId, folderId);

  return (
    <FolderContents
      userId={userId}
      currentFolder={folder}
      breadcrumbPath={breadcrumbPath}
      storageBytes={storageBytes}
    />
  );
}
