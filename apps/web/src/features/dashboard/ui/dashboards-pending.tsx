"use client";

import { createContext, type ReactNode, useContext, useTransition } from "react";
import { useRouter } from "@/lib/navigation";

type Pending = { pending: boolean; navigate: (input: { href: string }) => void };

const PendingContext = createContext<Pending | null>(null);

/**
 * Tab, range and customer changes as one transition (ADR 0086): the current dashboard stays on
 * screen, marked pending, until the next one is ready, so its figures count to their new values
 * instead of the content blinking out.
 */
export function DashboardsPendingProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const navigate = ({ href }: { href: string }) => startTransition(() => router.push(href));
  return (
    <PendingContext.Provider value={{ pending, navigate }}>{children}</PendingContext.Provider>
  );
}

/** The dashboards' navigation; outside the provider a plain push that is never pending. */
export function useDashboardsNavigate(): Pending {
  const router = useRouter();
  return (
    useContext(PendingContext) ?? { pending: false, navigate: ({ href }) => router.push(href) }
  );
}

/** The open dashboard, dimmed and busy while the next one loads. */
export function DashboardsContent({ children }: { children: ReactNode }) {
  const { pending } = useDashboardsNavigate();
  return (
    <div
      data-slot="dashboards-content"
      aria-busy={pending}
      className={
        pending
          ? "pointer-events-none animate-pulse opacity-60 transition-opacity"
          : "transition-opacity"
      }
    >
      {children}
    </div>
  );
}
