import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { listActiveRoster } from "@/lib/repos/roster";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function RosterPage() {
  const roster = await listActiveRoster();

  return (
    <main className="min-h-screen bg-[#f3f0ea] px-4 py-6 text-slate-900 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-lg flex-col justify-center gap-6">
        <header className="border-b border-slate-300 pb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
            Francis Family Cloud
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">
            Select your name to enter
          </h1>
        </header>

        <Card className="border-slate-300 bg-white shadow-sm">
          <CardHeader className="border-b border-slate-200">
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle>Family roster</CardTitle>
                <CardDescription>
                  Select your name, then sign in to your box.
                </CardDescription>
              </div>
              {roster.length > 0 && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800">
                  {roster.length} active
                </span>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            {roster.length === 0 ? (
              <p className="py-4 text-center text-sm text-slate-500">
                No family members have been added yet. Ask the admin to set up
                your account.
              </p>
            ) : (
              <div className="space-y-2">
                {roster.map((person) => (
                  <Link
                    key={person.userId}
                    href={`/login/${person.userId}`}
                    className={buttonVariants({
                      variant: "outline",
                      className:
                        "h-auto w-full justify-between rounded-xl border-slate-200 px-4 py-3",
                    })}
                  >
                    <span className="font-medium">{person.displayName}</span>
                    <ArrowRight className="size-4 text-slate-400" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
