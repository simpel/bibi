import type { ReactNode } from "react";

/** Pages for people without an account (customers paying a link). No session is read here. */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      {children}
    </main>
  );
}
