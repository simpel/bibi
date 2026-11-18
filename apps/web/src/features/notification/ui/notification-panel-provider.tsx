"use client";

import type { MyWorkTask } from "@bibi/core/schemas";
import { type ReactNode, Suspense, use, useCallback, useEffect, useMemo, useState } from "react";
import { loadNeedsYouAction } from "@/features/my-work/actions";
import { countDue } from "@/features/my-work/lib/count-due";
import { lastValue } from "@/lib/live-query-state";
import { usePathname } from "@/lib/navigation";
import { useLiveQuery } from "@/lib/use-live-query";
import { useWideScreen } from "@/lib/use-wide-screen";
import { visibleTasks } from "../lib/visible-tasks";
import { useNotificationLive } from "./notification-live-context";
import { NotificationPanelContext } from "./notification-panel-context";

type Tasks = MyWorkTask[] | null;

export type NotificationPanelProviderProps = {
  /** Needs you, still being read by the server (null without `order:read`). */
  needsYou: Promise<Tasks>;
  children: ReactNode;
};

/** Needs you again, with the page it was read for, so a `null` (no `order:read`) is a value. */
const loadTasks = async ({ pathname }: { pathname: string }) => {
  const result = await loadNeedsYouAction();
  return result.ok ? { ok: true as const, value: { tasks: result.value, pathname } } : result;
};

/**
 * The notification panel's state (spec: home): open on a wide screen while something needs the
 * member, until they close it with the bell; the bell toggles it. Needs you comes from the shell's
 * first read and is read again while the panel is open, when they navigate, open it again or a
 * notification arrives. A task the member dismisses stays greyed out until the next page (ADR
 * 0114). A fresh read also moves the My work badge.
 */
export function NotificationPanelProvider({ needsYou, children }: NotificationPanelProviderProps) {
  const [seeded, setSeeded] = useState<Tasks | undefined>(undefined);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [opens, setOpens] = useState(0);
  const [dismissed, setDismissed] = useState<ReadonlyMap<string, string>>(new Map());
  const wide = useWideScreen();
  const pathname = usePathname();
  const [firstPath] = useState(pathname);
  const [shownPath, setShownPath] = useState(pathname);
  // A row opened from the sheet on a narrow screen closes it: the page it opened is behind it.
  if (shownPath !== pathname) {
    setShownPath(pathname);
    if (!wide && choice) setChoice(false);
  }
  const { changed, setMyWorkDue } = useNotificationLive();
  const open = choice ?? (wide && (seeded?.length ?? 0) > 0);
  const stale = opens > 0 || changed > 0 || pathname !== firstPath;
  const live = useLiveQuery({
    input: open && stale ? { pathname, changed, opens } : null,
    load: loadTasks,
  });
  const fresh = lastValue({ state: live });
  // Syncing a fresh read into the shell's live counts provider (the My work badge).
  useEffect(() => {
    if (live.status === "ready") setMyWorkDue(countDue({ tasks: live.value.tasks }));
  }, [live, setMyWorkDue]);
  const setOpen = useCallback((next: boolean) => {
    setChoice(next);
    if (next) setOpens((count) => count + 1);
  }, []);
  const markDismissed = useCallback(
    ({ key }: { key: string }) => setDismissed((map) => new Map(map).set(key, pathname)),
    [pathname],
  );
  const value = useMemo(() => {
    const shown = visibleTasks({
      tasks: fresh ? fresh.tasks : seeded,
      readFor: fresh?.pathname ?? null,
      dismissed,
      pathname,
    });
    return { open, setOpen, ...shown, markDismissed };
  }, [open, setOpen, fresh, seeded, dismissed, pathname, markDismissed]);
  return (
    <NotificationPanelContext value={value}>
      <Suspense fallback={null}>
        <SeedNeedsYou needsYou={needsYou} onSeed={setSeeded} />
      </Suspense>
      {children}
    </NotificationPanelContext>
  );
}

type SeedNeedsYouProps = { needsYou: Promise<Tasks>; onSeed: (tasks: Tasks) => void };

/** Unwraps the server's Needs you (`use`) and hands it to the provider once it is read. */
function SeedNeedsYou({ needsYou, onSeed }: SeedNeedsYouProps) {
  const tasks = use(needsYou);
  // Syncing a server promise into the provider's state, which later reads replace.
  useEffect(() => onSeed(tasks), [tasks, onSeed]);
  return null;
}
