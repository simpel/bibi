"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const INTERVAL_MS = 3000;
const MAX_REFRESHES = 20;

/** Re-reads the page until the webhook has marked the payment paid, then unmounts itself. */
export function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    let count = 0;
    const timer = setInterval(() => {
      count += 1;
      router.refresh();
      if (count >= MAX_REFRESHES) clearInterval(timer);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}
