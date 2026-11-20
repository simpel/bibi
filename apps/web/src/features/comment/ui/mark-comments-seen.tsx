"use client";

import { useEffect, useRef } from "react";
import { useMarkSeen } from "./use-mark-seen";

export type MarkCommentsSeenProps = { ids: readonly string[] };

/** Marks the caller's comment notifications read once the Comments section is on screen. */
export function MarkCommentsSeen({ ids }: MarkCommentsSeenProps) {
  const marker = useRef<HTMLSpanElement>(null);
  const markSeen = useMarkSeen({ ids });
  // Syncs with the browser's IntersectionObserver: seen means scrolled into view.
  useEffect(() => {
    const element = marker.current;
    if (!element || ids.length === 0) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        void markSeen();
      }
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [ids, markSeen]);
  return <span ref={marker} aria-hidden className="block h-px" />;
}
