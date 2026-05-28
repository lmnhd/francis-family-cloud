"use client";

import type { ReactNode } from "react";

// Shell for global client-side providers.
// Phase 1 adds: SessionProvider from next-auth/react.
// Phase 4 may add: theme, toast, analytics boundaries.
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
