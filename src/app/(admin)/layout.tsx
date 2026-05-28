import { redirect } from "next/navigation";
import { auth } from "@/auth";
import type { ReactNode } from "react";

export default async function AdminGroupLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  if (!session?.user) redirect("/");
  if (session.user.role !== "admin") redirect("/box");
  return <>{children}</>;
}
