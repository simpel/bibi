"use client";

import { useCallback } from "react";
import { useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Navigates to the start page, where the assistant lives (ADR 0035). */
export function useGoHome() {
  const router = useRouter();
  return useCallback(() => router.push(ROUTES.home), [router]);
}
