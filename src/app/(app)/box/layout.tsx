import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Box, Cloud, Search, Settings, Trash2, Users } from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { EditNameButton } from "@/components/box/EditNameButton";
import { signOutAction } from "./actions";

export default async function BoxLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/");

  const name = session.user.name ?? "Family member";

  return (
    <div className="flex h-screen flex-col bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:flex-row">
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 md:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Francis Family Cloud
          </p>
          <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-200">
            {name}
          </p>
        </div>
        <nav className="flex items-center gap-0.5">
          <MobileNavLink href="/box" label="Box">
            <Box className="size-5" />
          </MobileNavLink>
          <MobileNavLink href="/box/search" label="Search">
            <Search className="size-5" />
          </MobileNavLink>
          <MobileNavLink href="/box/family" label="Family">
            <Users className="size-5" />
          </MobileNavLink>
          <MobileNavLink href="/box/imports" label="Imports">
            <Cloud className="size-5" />
          </MobileNavLink>
          <MobileNavLink href="/box/trash" label="Trash">
            <Trash2 className="size-5" />
          </MobileNavLink>
          <MobileNavLink href="/box/settings" label="Settings">
            <Settings className="size-5" />
          </MobileNavLink>
          <ThemeToggle />
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg p-2 text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              Out
            </button>
          </form>
        </nav>
      </header>

      {/* ── Desktop sidebar ─────────────────────────────────────────────── */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 md:flex">
        <div className="border-b border-slate-100 px-4 py-4 dark:border-slate-800">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Francis Family Cloud
          </p>
          <EditNameButton currentName={name} />
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          <SidebarLink href="/box" icon={<Box className="size-4" />} label="My Box" />
          <SidebarLink href="/box/search" icon={<Search className="size-4" />} label="Search" />
          <SidebarLink href="/box/family" icon={<Users className="size-4" />} label="Family" />
          <SidebarLink href="/box/imports" icon={<Cloud className="size-4" />} label="Imports" />
          <SidebarLink href="/box/trash" icon={<Trash2 className="size-4" />} label="Trash" />
          <SidebarLink href="/box/settings" icon={<Settings className="size-4" />} label="Settings" />
        </nav>

        <div className="flex items-center justify-between border-t border-slate-100 p-3 dark:border-slate-800">
          <form action={signOutAction}>
            <button
              type="submit"
              className="rounded-lg px-3 py-2 text-left text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            >
              Sign out
            </button>
          </form>
          <ThemeToggle />
        </div>
      </aside>

      <main className="flex h-full flex-1 flex-col overflow-hidden">{children}</main>
    </div>
  );
}

function SidebarLink({
  href,
  icon,
  label,
}: {
  href: string;
  icon: ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
    >
      <span className="shrink-0 text-slate-400 dark:text-slate-500">{icon}</span>
      {label}
    </Link>
  );
}

function MobileNavLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      title={label}
      className="rounded-lg p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
    >
      {children}
    </Link>
  );
}
