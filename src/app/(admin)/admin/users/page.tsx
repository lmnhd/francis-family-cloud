import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { listAllUsers } from "@/lib/repos/users";
import { UserRow } from "@/components/admin/UserRow";
import { CreateUserForm } from "@/components/admin/CreateUserForm";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/box");

  const users = await listAllUsers();
  const sorted = [...users].sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );

  return (
    <div className="mx-auto max-w-3xl px-6 py-8">
      <h1 className="mb-6 text-xl font-semibold text-slate-900">Users</h1>

      <div className="mb-8 space-y-1.5">
        {sorted.map((user) => (
          <UserRow key={user.id} user={user} currentAdminId={session.user.id} />
        ))}
        {sorted.length === 0 && (
          <p className="py-4 text-center text-sm text-slate-400">
            No users yet.
          </p>
        )}
      </div>

      <CreateUserForm />
    </div>
  );
}
