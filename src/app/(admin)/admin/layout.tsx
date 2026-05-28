import Link from "next/link";
import { Users, HardDrive, Activity, Link2, ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

const NAV = [
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/storage", icon: HardDrive, label: "Storage" },
  { href: "/admin/activity", icon: Activity, label: "Activity" },
  { href: "/admin/share-links", icon: Link2, label: "Share Links" },
];

export default function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex h-screen bg-[#f3f0ea] text-slate-900">
      <aside className="flex w-52 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-4 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
            Admin
          </p>
          <p className="mt-0.5 text-sm font-medium text-slate-800">
            Francis Family Cloud
          </p>
        </div>

        <nav className="flex-1 space-y-0.5 p-2">
          {NAV.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <Icon className="size-4 shrink-0 text-slate-400" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <Link
            href="/box"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-50 hover:text-slate-700"
          >
            <ArrowLeft className="size-4" />
            Back to box
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
