"use client";

import { useActionState } from "react";
import { ArrowLeft, LogIn } from "lucide-react";
import Link from "next/link";
import { loginAction } from "./actions";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Props {
  userId: string;
  displayName: string;
}

export function LoginForm({ userId, displayName }: Props) {
  const boundAction = loginAction.bind(null, userId);
  const [state, formAction, isPending] = useActionState(boundAction, {
    error: false,
  });

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-900 dark:bg-slate-950 dark:text-slate-100 md:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm flex-col justify-center gap-6">
        <Link
          href="/"
          className={buttonVariants({
            variant: "ghost",
            className: "w-fit gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100",
          })}
        >
          <ArrowLeft className="size-4" />
          Back to roster
        </Link>

        <Card className="border-slate-300 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle>{displayName}</CardTitle>
            <CardDescription>
              Enter your password to open your box.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form action={formAction} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoFocus
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-slate-500"
                  placeholder="Your password"
                />
              </div>

              {state.error && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  Incorrect password. Please try again.
                </p>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full gap-2"
              >
                <LogIn className="size-4" />
                {isPending ? "Signing in…" : "Sign in"}
              </Button>

              <p className="text-center text-xs text-slate-500 dark:text-slate-400">
                Forgot your password? Ask a family admin to reset it.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
