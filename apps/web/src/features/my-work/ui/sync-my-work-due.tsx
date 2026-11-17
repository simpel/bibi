"use client";

import { useEffect } from "react";
import { useNotificationLive } from "@/features/notification/ui/notification-live-context";

/**
 * Hands the count of Needs you tasks due now, read with this page, to the sidebar's My work badge,
 * so the badge matches the list after the member acted (the stream does not carry it).
 */
export function SyncMyWorkDue({ count }: { count: number | null }) {
  const { setMyWorkDue } = useNotificationLive();
  // Syncing this render's server count into the shell's live counts provider.
  useEffect(() => setMyWorkDue(count), [count, setMyWorkDue]);
  return null;
}
