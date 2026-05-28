import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getOrCreateRootFolder } from "@/lib/repos/folders";
import { getUserStorageBytes } from "@/lib/repos/files";
import { FolderContents } from "./_folder-contents";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ view?: string }>;
}

export default async function BoxPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { view } = await searchParams;
  const viewMode = view === "grid" ? "grid" : "list";

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
      viewMode={viewMode}
      currentPath="/box"
    />
  );
}
