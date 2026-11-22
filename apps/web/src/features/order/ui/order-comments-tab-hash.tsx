"use client";

import { useEffect } from "react";
import { COMMENTS_ANCHOR, lineOfHash } from "@/features/comment/lib/comment-anchor";
import { usePathname, useRouter } from "@/lib/navigation";
import { COMMENTS_TAB } from "../order-tabs";

export type OrderCommentsTabHashProps = { active: boolean };

/**
 * Comments live in the Activity tab. A `#comments` or `#comment-<lineId>` hash (a notification,
 * a comment icon on a line) on another tab opens that tab and keeps the hash, so the composer
 * picks the line there (ADR 0115). Renders nothing.
 */
export function OrderCommentsTabHash({ active }: OrderCommentsTabHashProps) {
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (active) return;
    const follow = () => {
      const { hash } = window.location;
      if (hash !== `#${COMMENTS_ANCHOR}` && lineOfHash({ hash }) === null) return;
      router.replace(`${pathname}?tab=${COMMENTS_TAB}${hash}`);
    };
    follow();
    window.addEventListener("hashchange", follow);
    return () => window.removeEventListener("hashchange", follow);
  }, [active, pathname, router]);
  return null;
}
