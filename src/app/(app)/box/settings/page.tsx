import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Settings } from "lucide-react";
import { PasswordChangeForm } from "@/components/box/PasswordChangeForm";
import { EditNameButton } from "@/components/box/EditNameButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  return (
    <div className="mx-auto max-w-md px-4 py-8 md:px-6">
      <div className="mb-8 flex items-center gap-2">
        <Settings className="size-5 text-slate-400" />
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <div className="space-y-8">
        {/* Display name */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Your name
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <p className="mb-2 text-xs text-slate-500 dark:text-slate-400">
              This is how your name appears on the sign-in screen and in your box.
              Click it to edit.
            </p>
            <div className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700">
              <EditNameButton currentName={session.user.name ?? ""} />
            </div>
          </div>
        </section>

        {/* Password */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Password
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
            <PasswordChangeForm />
          </div>
        </section>
      </div>
    </div>
  );
}
