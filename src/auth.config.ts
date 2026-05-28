// Edge-safe auth config — no DynamoDB or NAPI modules.
// Used by middleware (Edge runtime) to verify the JWT cookie.
// The full auth.ts extends this with the Credentials provider.
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = nextUrl;

      if (pathname.startsWith("/admin")) {
        return isLoggedIn && auth?.user?.role === "admin";
      }
      if (pathname.startsWith("/box")) {
        return isLoggedIn;
      }
      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role)
        (session.user as { role?: string }).role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
