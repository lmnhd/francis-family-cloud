"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export async function loginAction(
  userId: string,
  _prevState: { error: boolean },
  formData: FormData
): Promise<{ error: boolean }> {
  try {
    await signIn("credentials", {
      userId,
      password: formData.get("password") as string,
      redirectTo: "/box",
    });
  } catch (err) {
    // Auth.js throws NEXT_REDIRECT on success — re-throw it so Next.js handles it.
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
    if (err instanceof AuthError) return { error: true };
    throw err;
  }
  return { error: false };
}
