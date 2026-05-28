import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { getUserById, verifyPassword, recordLastLogin } from "@/lib/repos/users";
import {
  checkRateLimit,
  incrementLoginAttempt,
  resetLoginAttempts,
} from "@/lib/repos/rate-limit";
import { writeAuditEvent } from "@/lib/repos/audit";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        userId: {},
        password: {},
      },
      async authorize(credentials) {
        const parsed = z
          .object({
            userId: z.string().min(1),
            password: z.string().min(1),
          })
          .safeParse(credentials);

        if (!parsed.success) return null;
        const { userId, password } = parsed.data;

        const rateCheck = await checkRateLimit(userId);
        if (!rateCheck.allowed) {
          await writeAuditEvent({
            targetUserId: userId,
            eventType: "auth.login.rate_limited",
          });
          return null;
        }

        const user = await getUserById(userId);
        if (!user || user.disabledAt || !user.showOnLoginRoster) {
          await incrementLoginAttempt(userId);
          return null;
        }

        const valid = await verifyPassword(password, user.passwordHash);
        if (!valid) {
          await incrementLoginAttempt(userId);
          await writeAuditEvent({
            targetUserId: userId,
            eventType: "auth.login.failure",
          });
          return null;
        }

        await resetLoginAttempts(userId);
        await recordLastLogin(userId);
        await writeAuditEvent({
          targetUserId: userId,
          eventType: "auth.login.success",
        });

        return {
          id: user.id,
          name: user.displayName,
          email: user.email ?? null,
          role: user.role,
        };
      },
    }),
  ],
});
