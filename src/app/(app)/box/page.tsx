import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateRootFolder } from "@/lib/repos/folders";
import { getUserStorageBytes } from "@/lib/repos/files";
import { FolderContents } from "./_folder-contents";

export const dynamic = "force-dynamic";

export default async function BoxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;
  const [rootFolder, storageBytes] = await Promise.all([
    getOrCreateRootFolder(userId),
    getUserStorageBytes(userId),
  ]);

  return (
    <FolderContents
      userId={userId}
      currentFolder={rootFolder}
      breadcrumbPath={[]}
      storageBytes={storageBytes}
    />
  );
}
