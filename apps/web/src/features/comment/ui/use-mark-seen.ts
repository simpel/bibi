"use client";

import { useCallback, useRef } from "react";
import { markNotificationsReadAction } from "@/features/notification/actions";
import { useRouter } from "@/lib/navigation";

/**
 * Marks the caller's own comment notifications read once (ADR 0115), then reloads so the red
 * dots go. No toast: seeing the comments is the action, nothing to confirm.
 */
export function useMarkSeen({ ids }: { ids: readonly string[] }) {
  const router = useRouter();
  const done = useRef(false);
  return useCallback(async () => {
    if (done.current || ids.length === 0) return;
    done.current = true;
    const result = await markNotificationsReadAction({ ids: [...ids] });
    if (result.ok) router.refresh();
  }, [ids, router]);
}
